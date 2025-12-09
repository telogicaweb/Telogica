import { useState, useContext, useEffect, useMemo } from 'react';
import { CartContext, type CartItem } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle, Loader2, MapPin, Phone, User, Building2, CheckCircle, Plus, Minus, FileText, Mail, Package, Truck, UserPlus } from 'lucide-react';
import type { RazorpayOptions, RazorpayResponse } from '../types/razorpay';

const Cart = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } = useContext(CartContext)!;
  const { user } = useContext(AuthContext)!;
  const toast = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [warrantyOptions, setWarrantyOptions] = useState<{ [key: string]: 'standard' | 'extended' }>({});

  // Address form fields
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Fetch location details based on pincode
  const fetchLocationByPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setAddressForm(prev => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state
        }));
        toast.success('Location detected from pincode!');
      } else {
        toast.error('Invalid pincode. Please enter manually.');
      }
    } catch (error) {
      console.error('Error fetching pincode data:', error);
      toast.error('Could not fetch location. Please enter manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setAddressForm(prev => ({ ...prev, pincode: numericValue }));

    if (numericValue.length === 6) {
      fetchLocationByPincode(numericValue);
    }
  };



  // Dropship State
  const [isDropship, setIsDropship] = useState(false);

  interface CustomerDetails {
    name: string;
    email: string;
    phone: string;
    address: string;
  }

  interface ShipmentGroup {
    id: string;
    customer: CustomerDetails;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      warrantyPrice: number;
      warrantyOption: 'standard' | 'extended';
      quotedProductId?: string;
    }>;
    invoiceUrl?: string;
  }

  const [shipmentGroups, setShipmentGroups] = useState<ShipmentGroup[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Dedicated state for new customer form (split address)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const [newCustomerPincodeLoading, setNewCustomerPincodeLoading] = useState(false);

  // Fetch location for new customer modal
  const fetchNewCustomerLocationByPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;

    setNewCustomerPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setNewCustomer(prev => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state
        }));
        toast.success('Location detected!');
      } else {
        toast.error('Invalid pincode');
      }
    } catch (error) {
      console.error('Error fetching pincode:', error);
    } finally {
      setNewCustomerPincodeLoading(false);
    }
  };

  const handleNewCustomerPincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setNewCustomer(prev => ({ ...prev, pincode: numericValue }));

    if (numericValue.length === 6) {
      fetchNewCustomerLocationByPincode(numericValue);
    }
  };

  // Calculate price based on whether retailer price should be used
  const getItemPrice = (item: CartItem) => {
    if (item.quotedProductId && item.quotedPrice) {
      return item.quotedPrice;
    }
    if (user?.role === 'retailer' && item.useRetailerPrice && item.product.retailerPrice) {
      return item.product.retailerPrice;
    }
    return item.product.price || 0;
  };

  // Get warranty price for an item
  const getWarrantyPrice = (item: CartItem) => {
    const warrantyOption = warrantyOptions[item.product._id] || 'standard';
    if (warrantyOption === 'extended' && item.product.extendedWarrantyAvailable) {
      return item.product.extendedWarrantyPrice || 0;
    }
    return 0;
  };

  // Calculate item total including warranty
  const getItemTotal = (item: CartItem) => {
    const basePrice = getItemPrice(item) * item.quantity;
    const warrantyPrice = getWarrantyPrice(item) * item.quantity;
    return basePrice + warrantyPrice;
  };

  // Calculate tax for an item
  const getItemTax = (item: CartItem) => {
    const itemTotal = getItemTotal(item);
    const taxPercentage = item.product.taxPercentage || 18;
    return (itemTotal * taxPercentage) / 100;
  };

  // Calculate Unassigned Items (Available for Assignment)
  const unassignedItems = useMemo(() => {
    return cart.map(item => {
      // Calculate total assigned quantity for this product across all groups
      const totalAssigned = shipmentGroups.reduce((sum, group) => {
        const groupItem = group.items.find(i => i.productId === item.product._id);
        return sum + (groupItem ? groupItem.quantity : 0);
      }, 0);

      return {
        ...item,
        remainingQuantity: Math.max(0, item.quantity - totalAssigned)
      };
    });
  }, [cart, shipmentGroups]);

  // Initial Check / Reset
  useEffect(() => {
    if (!isDropship) {
      setShipmentGroups([]);
    }
  }, [isDropship]);

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const totalTax = cart.reduce((acc, item) => acc + getItemTax(item), 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + totalTax + shipping;

  // Calculate total items count (sum of all quantities)
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Check if user needs to request a quote (regular user with >3 items)
  const requiresQuote = user?.role === 'user' && cart.length > 3;

  // Validate address form
  const isAddressValid = () => {
    return (
      addressForm.fullName.trim() &&
      addressForm.phone.trim() &&
      addressForm.streetAddress.trim() &&
      addressForm.city.trim() &&
      addressForm.state.trim() &&
      addressForm.pincode.trim()
    );
  };

  // Format address for backend
  const formatAddress = () => {
    return `${addressForm.fullName}, ${addressForm.phone}\n${addressForm.streetAddress}${addressForm.landmark ? ', ' + addressForm.landmark : ''}\n${addressForm.city}, ${addressForm.state} - ${addressForm.pincode}`;
  };

  // Multi-Ship Actions
  const handleAssignItem = (groupId: string, productId: string, assignQty: number) => {
    if (assignQty <= 0) return;

    setShipmentGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;

      // Find if item already exists in group
      const existingItemIndex = group.items.findIndex(i => i.productId === productId);
      const originalItem = cart.find(i => i.product._id === productId);

      if (!originalItem) return group;

      const newItem = {
        productId,
        quantity: assignQty,
        price: getItemPrice(originalItem),
        warrantyPrice: getWarrantyPrice(originalItem),
        warrantyOption: warrantyOptions[productId] || 'standard',
        quotedProductId: originalItem.quotedProductId
      };

      let newItems = [...group.items];
      if (existingItemIndex >= 0) {
        newItems[existingItemIndex].quantity += assignQty;
      } else {
        newItems.push(newItem);
      }

      return { ...group, items: newItems, invoiceUrl: undefined }; // Reset invoice on change
    }));
  };

  const handleRemoveFromGroup = (groupId: string, productId: string) => {
    setShipmentGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.filter(i => i.productId !== productId),
        invoiceUrl: undefined
      };
    }));
  };

  const handleRemoveGroup = (groupId: string) => {
    setShipmentGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.streetAddress || !newCustomer.pincode) {
      toast.error("Please fill all required customer details");
      return;
    }

    // Format full address for storage/display
    const formattedAddress = `${newCustomer.streetAddress}${newCustomer.landmark ? ', ' + newCustomer.landmark : ''}\n${newCustomer.city}, ${newCustomer.state} - ${newCustomer.pincode}`;

    const newGroup: ShipmentGroup = {
      id: Date.now().toString(),
      customer: {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: formattedAddress
      },
      items: []
    };
    setShipmentGroups([...shipmentGroups, newGroup]);

    // Reset form
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    });
    setIsAddingCustomer(false);
  };

  // ... (keep assignment/remove logic)

  const generateGroupInvoice = async (group: ShipmentGroup) => {
    if (group.items.length === 0) {
      toast.error("Add items to this customer first");
      return;
    }

    const loadingId = toast.loading("Generating Invoice...");
    try {
      // Construct items payload for API
      const invoiceItems = group.items.map(gi => {
        const original = cart.find(c => c.product._id === gi.productId);
        return {
          product: { name: original?.product.name || 'Unknown Product' },
          quantity: gi.quantity
        };
      });

      // FIX: Expect JSON response with URL, not blob
      const response = await api.post('/api/orders/dropship-invoice', {
        customerDetails: group.customer,
        items: invoiceItems
      });

      const { url } = response.data;

      if (!url) throw new Error("No URL returned");

      setShipmentGroups(prev => prev.map(g => {
        if (g.id === group.id) return { ...g, invoiceUrl: url };
        return g;
      }));

      // Open URL in new tab
      window.open(url, '_blank');

      toast.dismiss(loadingId);
      toast.success("Invoice generated!");
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingId);
      toast.error("Failed to generate invoice");
    }
  };

  // ... (Update Add Customer Modal rendering in the JSX below)


  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (requiresQuote) {
      toast.warning('You have more than 3 items in your cart. Please request a quote for bulk orders.');
      navigate('/quote');
      return;
    }

    // Check for Telecommunication products exceeding quantity limits (non-retailers only)
    if (user.role !== 'retailer') {
      const telecomOverLimit = cart.find(item => {
        const isTelecom = item.product.isTelecom || item.product.category?.toLowerCase() === 'telecommunication';
        const maxDirectPurchase = item.product.maxDirectPurchaseQty ?? null;
        return isTelecom && maxDirectPurchase !== null && item.quantity > maxDirectPurchase;
      });

      if (telecomOverLimit) {
        const maxQty = telecomOverLimit.product.maxDirectPurchaseQty;
        toast.warning(`Telecommunication product "${telecomOverLimit.product.name}" quantity (${telecomOverLimit.quantity}) exceeds the maximum direct purchase limit of ${maxQty}. Please request a quote for bulk orders.`);
        return;
      }
    }

    if (!isDropship && !isAddressValid()) {
      toast.error('Please fill in all required address fields');
      return;
    }

    // Multi-Customer Dropship Validation
    if (isDropship) {
      if (shipmentGroups.length === 0) {
        toast.error("Please add at least one customer shipment group");
        return;
      }

      const groupsWithoutInvoice = shipmentGroups.filter(g => !g.invoiceUrl && g.items.length > 0);
      if (groupsWithoutInvoice.length > 0) {
        toast.error(`Please generate delivery notes for all customer groups (${groupsWithoutInvoice[0].customer.name})`);
        return;
      }
    }

    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway is not loaded. Please refresh the page and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const payload: any = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: getItemPrice(item),
          useRetailerPrice: item.useRetailerPrice,
          quotedProductId: item.quotedProductId,
          warrantyOption: warrantyOptions[item.product._id] || 'standard',
          warrantyPrice: getWarrantyPrice(item)
        })),
        totalAmount: total,
        shippingAddress: isDropship ? 'Multiple Shipments' : formatAddress(),
        isRetailerDirectPurchase: user?.role === 'retailer',
        isDropship
      };

      // Multi-Customer Dropship Payload
      if (isDropship && shipmentGroups.length > 0) {
        payload.dropshipShipments = shipmentGroups.map(group => ({
          customerDetails: {
            name: group.customer.name,
            email: group.customer.email,
            phone: group.customer.phone,
            address: group.customer.address
          },
          items: group.items,
          invoiceUrl: group.invoiceUrl
        }));
      }

      const { data } = await api.post('/api/orders', payload);

      if (!data.razorpayOrder) {
        throw new Error('Invalid order response from server');
      }

      // Razorpay Integration
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Rnat5mGdrSJJX4";
      console.log('Using Razorpay Key:', razorpayKey);

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Telogica",
        description: "Order Payment",
        order_id: data.razorpayOrder.id,
        handler: async function (response: RazorpayResponse) {
          try {
            // For multi-orders, data.order might be the first order or an array. 
            // The verification endpoint should handle it.
            // If backend returns 'order' as single object even for bulk, verification works fine.
            // Only if using bulk verification we might need adjustments. 
            // Existing code uses data.order._id.
            const orderIdToVerify = data.order ? data.order._id : (data.allOrders ? data.allOrders[0]._id : null);

            await api.post('/api/orders/verify', {
              orderId: orderIdToVerify,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast.success('Payment completed successfully! Your order has been placed.');
            clearCart();
            // Redirect to appropriate dashboard based on user role
            navigate(user.role === 'retailer' ? '/retailer-dashboard' : '/user-dashboard');
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: { error: { description: string } }) {
        toast.error('Payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      rzp1.open();

    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const axiosError = error as { response?: { data?: { requiresQuote?: boolean; message?: string } }; message?: string };
      if (axiosError.response?.data?.requiresQuote) {
        toast.warning(axiosError.response.data.message || 'This order requires a quote.');
        navigate('/quote');
      } else {
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Unknown error occurred';
        toast.error('Checkout Failed: ' + errorMessage);
      }
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-6 rounded-full shadow-sm inline-block mb-4">
            <ShoppingBag size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {/* Warning for users with more than 3 items */}
        {requiresQuote && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have more than 3 items in your cart. As a regular user, you need to request a quote for bulk orders.
                  Click "Request Quote" below instead of checkout.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <div className="lg:col-span-7">
            {/* Cart Items / Unassigned Pool */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    {isDropship ? "Unassigned Items (Self-Shipment)" : "Shopping Cart"}
                  </h2>
                  {isDropship && (
                    <p className="text-xs text-gray-500 mt-1">
                      Items left here will be shipped to your registered address.
                    </p>
                  )}
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {isDropship
                    ? `${unassignedItems.reduce((acc, i) => acc + i.remainingQuantity, 0)} items remaining`
                    : `${totalItemsCount} items total`}
                </span>
              </div>

              <ul className="divide-y divide-gray-200">
                {(isDropship ? unassignedItems : cart).map((item) => {
                  const displayQty = isDropship ? (item as any).remainingQuantity : item.quantity;
                  if (isDropship && displayQty === 0) return null;

                  return (
                    <li key={item.product._id} className="p-6 flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden relative">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                          alt={item.product.name}
                          className="w-full h-full object-center object-cover"
                        />
                        <span className="absolute top-1 right-1 bg-white/90 text-gray-900 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow">
                          {item.product.category}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link to={`/product/${item.product._id}`} className="hover:text-indigo-600 transition-colors">
                                {item.product.name}
                              </Link>
                            </h3>
                            <p className="ml-4 font-bold text-indigo-600">₹{getItemTotal(item).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                          {item.quotedProductId ? (
                            <p className="text-xs text-green-600 mt-1 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Special Quoted Price
                            </p>
                          ) : item.useRetailerPrice && item.product.retailerPrice ? (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle size={12} /> Retailer Price
                            </p>
                          ) : null}

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              Price: <strong>₹{getItemPrice(item).toFixed(2)}</strong> x {item.quantity}
                            </span>
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-medium border border-indigo-100">
                              Tax: {item.product.taxPercentage || 18}% GST
                            </span>
                          </div>

                          {/* Warranty Selection */}
                          <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Warranty Option</p>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                <input
                                  type="radio"
                                  name={`warranty-${item.product._id}`}
                                  checked={(warrantyOptions[item.product._id] || 'standard') === 'standard'}
                                  onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'standard' }))}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">
                                  Standard - {item.product.warrantyPeriodMonths || 12} months <span className="text-green-600 font-medium">(Free)</span>
                                </span>
                              </label>

                              {item.product.extendedWarrantyAvailable && (
                                <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                  <input
                                    type="radio"
                                    name={`warranty-${item.product._id}`}
                                    checked={warrantyOptions[item.product._id] === 'extended'}
                                    onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'extended' }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span className="text-sm text-gray-700">
                                    Extended - {item.product.extendedWarrantyMonths || 24} months <span className="text-indigo-600 font-medium">(+₹{(item.product.extendedWarrantyPrice || 0).toFixed(2)})</span>
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.quotedProductId)}
                              disabled={item.quantity <= 1}
                              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={14} className="text-gray-600" />
                            </button>
                            <span className="text-gray-900 font-semibold w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.quotedProductId)}
                              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <Plus size={14} className="text-gray-600" />
                            </button>
                          </div>

                          {/* Dropship Controls or Remove */}
                          {isDropship ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <select
                                className="block w-full sm:w-40 pl-3 pr-10 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignItem(e.target.value, item.product._id, 1);
                                    e.target.value = ''; // Reset
                                  }
                                }}
                                value=""
                              >
                                <option value="">Assign to...</option>
                                {shipmentGroups.map(bg => (
                                  <option key={bg.id} value={bg.id}>{bg.customer.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product._id, item.quotedProductId)}
                              className="font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Dropship Shipment Groups */}
            {isDropship && (
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    Customer Shipments
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomer(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="-ml-1 mr-2 h-4 w-4" />
                    Add Customer
                  </button>
                </div>

                {/* Add Customer Form */}
                {isAddingCustomer && (
                  <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 ring-4 ring-indigo-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserPlus size={18} className="text-indigo-600" />
                      New Customer Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name & Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <User size={14} className="text-indigo-600" /> Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.name}
                          onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Mail size={14} className="text-indigo-600" /> Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.email}
                          onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="customer@example.com"
                        />
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Phone size={14} className="text-indigo-600" /> Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="Phone Number"
                        />
                      </div>

                      {/* Detailed Address Fields */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Building2 size={14} className="text-indigo-600" /> Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.streetAddress}
                          onChange={e => setNewCustomer({ ...newCustomer, streetAddress: e.target.value })}
                          placeholder="House No, Building, Street"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" /> Landmark
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.landmark}
                          onChange={e => setNewCustomer({ ...newCustomer, landmark: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>

                      {/* Pincode with Auto-Fetch */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                          <MapPin size={14} className="text-indigo-600" /> Pincode *
                          {newCustomerPincodeLoading && (
                            <span className="text-xs text-indigo-600 flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Fetching...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          className="w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newCustomer.pincode}
                          onChange={e => handleNewCustomerPincodeChange(e.target.value)}
                          placeholder="6-digit Pincode"
                          disabled={newCustomerPincodeLoading}
                        />
                      </div>

                      {/* Auto-filled City & State */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          City {newCustomer.city ? <span className="text-green-600 text-xs">(Auto)</span> : '*'}
                        </label>
                        <input
                          type="text"
                          required
                          readOnly
                          className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${newCustomer.city ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}
                          value={newCustomer.city}
                          placeholder="Auto-filled"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          State {newCustomer.state ? <span className="text-green-600 text-xs">(Auto)</span> : '*'}
                        </label>
                        <input
                          type="text"
                          required
                          readOnly
                          className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${newCustomer.state ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}
                          value={newCustomer.state}
                          placeholder="Auto-filled"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => setIsAddingCustomer(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustomer}
                        disabled={!newCustomer.city || !newCustomer.pincode || newCustomer.pincode.length !== 6}
                        className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Save Customer
                      </button>
                    </div>
                  </div>
                )}

                {/* Group Cards */}
                {shipmentGroups.map((group, idx) => (
                  <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start md:items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full hidden sm:block">
                          <User size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{group.customer.name}</h4>
                          <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:gap-4 mt-1">
                            <span className="flex items-center gap-1"><Mail size={12} /> {group.customer.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12} /> {group.customer.phone}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-start gap-1 max-w-lg truncate">
                            <Building2 size={12} className="flex-shrink-0 mt-0.5" />
                            {group.customer.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {group.invoiceUrl ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={12} /> Invoice Generated
                          </span>
                        ) : (
                          <button
                            onClick={() => generateGroupInvoice(group)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-md text-xs font-medium transition-colors"
                          >
                            <FileText size={14} /> Generate Invoice
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Group Items */}
                    <div className="px-6 py-4">
                      {group.items.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-gray-500 text-sm">No items assigned yet.</p>
                          <p className="text-gray-400 text-xs mt-1">Select items from the "Unassigned Pool" above.</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {group.items.map(gi => {
                            const product = cart.find(c => c.product._id === gi.productId)?.product;
                            if (!product) return null;
                            return (
                              <li key={gi.productId} className="py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                    <img src={product.images?.[0]} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {gi.quantity} x ₹{gi.price.toFixed(2)}</p>
                                    {gi.warrantyOption === 'extended' && (
                                      <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-100">+ Extended Warranty</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromGroup(group.id, gi.productId)}
                                  className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                >
                                  <Minus size={14} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </h2>
              </div>

              {/* Summary Details */}
              <div className="p-6">
                <dl className="space-y-3">
                  {/* Items Count */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-gray-400" />
                      Items in cart
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                      {totalItemsCount}
                    </dd>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600">Subtotal (Before Tax)</dt>
                    <dd className="text-base font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>

                  {/* Tax */}
                  <div className="flex items-center justify-between py-2 bg-green-50 -mx-6 px-6 rounded">
                    <dt className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <span>Total Tax (GST)</span>
                      <span className="text-xs text-gray-500">(18%)</span>
                    </dt>
                    <dd className="text-base font-semibold text-green-600">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm font-medium text-gray-600">Shipping</dt>
                    <dd className="text-base font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle size={16} />
                      FREE
                    </dd>
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-gray-200 my-2"></div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 bg-gradient-to-r from-indigo-50 to-blue-50 -mx-6 px-6 rounded-lg">
                    <dt className="text-lg font-bold text-gray-900">Order Total</dt>
                    <dd className="text-2xl font-bold text-indigo-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>
                </dl>

                {/* Savings Badge (if applicable) */}
                {shipping === 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                    <p className="text-xs text-green-700 font-medium">
                      You're saving on shipping! Free delivery on all orders.
                    </p>
                  </div>
                )}
              </div>

              {/* Address Section */}
              <div className="px-6 pb-6 space-y-5">
                <div className="border-t-2 border-gray-100 pt-6">
                  <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2 bg-gray-50 -mx-6 px-6 py-3 rounded-t-lg">
                    <MapPin size={20} className="text-indigo-600" />
                    Shipping Address
                  </h3>

                  {/* Dropship Toggle for Retailers */}
                  {user?.role === 'retailer' && (
                    <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <User className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Ship to Customer (Dropship)</p>
                          <p className="text-xs text-gray-600 mt-0.5">Send directly to your customer with a no-price invoice</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isDropship}
                          onChange={(e) => {
                            setIsDropship(e.target.checked);
                            // Reset form if unchecking? Maybe keep it.
                          }}
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                      </label>
                    </div>
                  )}

                  {isDropship ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 text-center mb-6">
                      <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="text-indigo-600" size={24} />
                      </div>
                      <h4 className="text-indigo-900 font-medium mb-1">Multi-Customer Shipping</h4>
                      <p className="text-indigo-700 text-sm">
                        Please manage customer addresses and assign items in the <strong>Customer Shipments</strong> section on the left.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <User size={14} className="text-indigo-600" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            required
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Phone size={14} className="text-indigo-600" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            required
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Building2 size={14} className="text-indigo-600" />
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          required
                          value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                          placeholder="House No, Building Name, Street"
                        />
                      </div>

                      <div>
                        <label htmlFor="landmark" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          Landmark <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          id="landmark"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                          placeholder="Near Park, Behind Mall, etc."
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin size={14} className="text-indigo-600" />
                            Pincode *
                            {pincodeLoading && (
                              <span className="text-xs text-indigo-600 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" />
                                Detecting location...
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            id="pincode"
                            required
                            value={addressForm.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                            disabled={pincodeLoading}
                          />
                          <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            City & State will be auto-detected
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                            City * {addressForm.city && <span className="text-xs text-green-600">(Auto-filled)</span>}
                          </label>
                          <input
                            type="text"
                            id="city"
                            required
                            readOnly
                            value={addressForm.city}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all ${addressForm.city ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                            placeholder="City will auto-fill"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                            State * {addressForm.state && <span className="text-xs text-green-600">(Auto-filled)</span>}
                          </label>
                          <input
                            type="text"
                            id="state"
                            required
                            readOnly
                            value={addressForm.state}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all ${addressForm.state ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                            placeholder="State will auto-fill"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-6 border-t-2 border-gray-100">
                    {requiresQuote ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3.5 border-2 border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02]"
                        >
                          Request Quote
                          <ArrowRight size={20} className="ml-2" />
                        </button>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-blue-700 font-medium">
                            Bulk orders require admin approval for discounted pricing
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className="w-full flex justify-center items-center px-6 py-3.5 border-2 border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all disabled:from-indigo-400 disabled:to-blue-400 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={20} className="mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Proceed to Checkout
                              <ArrowRight size={20} className="ml-2" />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                        >
                          <FileText size={18} className="mr-2" />
                          Request a Quote
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Shopping Link */}
                <div className="px-6 pb-6 text-center">
                  <p className="text-sm text-gray-500">
                    or{' '}
                    <Link to="/products" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-all">
                      Continue Shopping
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
