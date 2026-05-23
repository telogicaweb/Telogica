import { useState, useContext, useEffect, useMemo } from 'react';
import { CartContext, type CartItem } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle, Loader2, MapPin, Phone, User, Building2, CheckCircle, Plus, Minus, FileText, Mail, Package, Truck, UserPlus, ChevronRight } from 'lucide-react';
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

      // Expect JSON response with URL
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
            const orderIdToVerify = data.order ? data.order._id : (data.allOrders ? data.allOrders[0]._id : null);

            await api.post('/api/orders/verify', {
              orderId: orderIdToVerify,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast.success('Payment completed successfully! Your order has been placed.');
            clearCart();
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
      <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-6 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] inline-block mb-4 border border-gray-100">
            <ShoppingBag size={40} className="text-gray-350" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-xs text-gray-500 mb-8 max-w-sm">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Combined Header (Breadcrumbs + Hero Banner) */}
      <section className="bg-slate-900 text-white pt-24 pb-6 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
          {/* Integrated Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Shopping Cart</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Shopping Cart
          </h1>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Warning for users with more than 3 items */}
        {requiresQuote && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm border border-amber-100/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Bulk Quotation Required</p>
              <p className="text-xs text-amber-700 mt-1">
                You have more than 3 items in your cart. As a regular user, you need to request a quote for bulk orders. Click "Request a Quote" below instead of checking out.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Cart Items / Unassigned Pool */}
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-650" />
                    {isDropship ? "Unassigned Items (Self-Shipment)" : "Selected Products"}
                  </h2>
                  {isDropship && (
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">
                      Items left here will be shipped to your registered address.
                    </p>
                  )}
                </div>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {isDropship
                    ? `${unassignedItems.reduce((acc, i) => acc + i.remainingQuantity, 0)} items left`
                    : `${totalItemsCount} items`}
                </span>
              </div>

              <ul className="divide-y divide-gray-100">
                {(isDropship ? unassignedItems : cart).map((item) => {
                  const displayQty = isDropship ? (item as any).remainingQuantity : item.quantity;
                  if (isDropship && displayQty === 0) return null;

                  return (
                    <li key={item.product._id} className="p-6 flex flex-col sm:flex-row gap-5">
                      <div className="flex-shrink-0 w-20 h-20 border border-gray-200/50 rounded-lg overflow-hidden relative shadow-sm">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                          alt={item.product.name}
                          className="w-full h-full object-center object-cover"
                        />
                        <span className="absolute top-1 right-1 bg-white/90 text-gray-900 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow border border-gray-155">
                          {item.product.category}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start text-sm font-bold text-gray-900 gap-4">
                            <h3>
                              <Link to={`/product/${item.product._id}`} className="hover:text-indigo-655 transition-colors line-clamp-2">
                                {item.product.name}
                              </Link>
                            </h3>
                            <p className="font-extrabold text-indigo-600 text-sm whitespace-nowrap">₹{getItemTotal(item).toFixed(2)}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{item.product.category}</p>
                          
                          {item.quotedProductId ? (
                            <p className="text-[10px] text-green-600 mt-1 font-bold flex items-center gap-1">
                              <CheckCircle size={12} className="text-green-650" /> Special Quoted Price Applied
                            </p>
                          ) : item.useRetailerPrice && item.product.retailerPrice ? (
                            <p className="text-[10px] text-green-600 mt-1 font-bold flex items-center gap-1">
                              <CheckCircle size={12} className="text-green-650" /> Retailer Discount Price Applied
                            </p>
                          ) : null}

                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px]">
                            <span className="text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded font-semibold">
                              Price: <strong>₹{getItemPrice(item).toFixed(2)}</strong> x {item.quantity}
                            </span>
                            <span className="text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded font-bold border border-indigo-100/30">
                              GST: {item.product.taxPercentage || 18}% Tax
                            </span>
                          </div>

                          {/* Warranty Selection */}
                          <div className="mt-3.5 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[9px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Warranty Duration</p>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center space-x-2.5 cursor-pointer hover:bg-white p-1 rounded transition-colors text-xs font-semibold text-gray-700">
                                <input
                                  type="radio"
                                  name={`warranty-${item.product._id}`}
                                  checked={(warrantyOptions[item.product._id] || 'standard') === 'standard'}
                                  onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'standard' }))}
                                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span>
                                  Standard - {item.product.warrantyPeriodMonths || 12} months <span className="text-green-655 font-bold text-[10px]">(FREE)</span>
                                </span>
                              </label>

                              {item.product.extendedWarrantyAvailable && (
                                <label className="flex items-center space-x-2.5 cursor-pointer hover:bg-white p-1 rounded transition-colors text-xs font-semibold text-gray-700">
                                  <input
                                    type="radio"
                                    name={`warranty-${item.product._id}`}
                                    checked={warrantyOptions[item.product._id] === 'extended'}
                                    onChange={() => setWarrantyOptions(prev => ({ ...prev, [item.product._id]: 'extended' }))}
                                    className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span>
                                    Extended - {item.product.extendedWarrantyMonths || 24} months <span className="text-indigo-600 font-bold text-[10px]">(+₹{(item.product.extendedWarrantyPrice || 0).toFixed(2)})</span>
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3.5 border-t border-gray-50">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.quotedProductId)}
                              disabled={item.quantity <= 1}
                              className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                              <Minus size={12} className="text-gray-650" />
                            </button>
                            <span className="text-gray-900 font-bold w-6 text-center text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.quotedProductId)}
                              className="p-1 rounded hover:bg-white transition-colors shadow-sm"
                            >
                              <Plus size={12} className="text-gray-655" />
                            </button>
                          </div>

                          {/* Dropship Controls or Remove */}
                          {isDropship ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <select
                                className="block w-full sm:w-40 pl-2 pr-8 py-1.5 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded bg-gray-50 font-bold text-gray-700"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignItem(e.target.value, item.product._id, 1);
                                    e.target.value = ''; // Reset
                                  }
                                }}
                                value=""
                              >
                                <option value="" className="font-semibold text-gray-500">Assign to Customer...</option>
                                {shipmentGroups.map(bg => (
                                  <option key={bg.id} value={bg.id} className="font-semibold">{bg.customer.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product._id, item.quotedProductId)}
                              className="font-bold text-red-500 hover:text-red-600 flex items-center gap-1 text-[10px] uppercase tracking-wider bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded transition-colors border border-red-100/35"
                            >
                              <Trash2 size={12} />
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
              <div className="space-y-6">
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-650" />
                    Customer Shipments
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomer(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-xs font-bold uppercase tracking-wider rounded text-white bg-indigo-650 hover:bg-indigo-750 focus:outline-none transition-colors"
                  >
                    <Plus className="-ml-1 mr-1.5 h-3.5 w-3.5" />
                    Add Customer
                  </button>
                </div>

                {/* Add Customer Form */}
                {isAddingCustomer && (
                  <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border-2 border-indigo-150 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                      <UserPlus size={16} className="text-indigo-655" />
                      New Customer Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name & Email */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold"
                          value={newCustomer.name}
                          onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold"
                          value={newCustomer.email}
                          onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="customer@example.com"
                        />
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold"
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="Phone Number"
                        />
                      </div>

                      {/* Detailed Address Fields */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold"
                          value={newCustomer.streetAddress}
                          onChange={e => setNewCustomer({ ...newCustomer, streetAddress: e.target.value })}
                          placeholder="House No, Building, Street"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold"
                          value={newCustomer.landmark}
                          onChange={e => setNewCustomer({ ...newCustomer, landmark: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>

                      {/* Pincode with Auto-Fetch */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span>Pincode *</span>
                          {newCustomerPincodeLoading && (
                            <span className="text-[9px] text-indigo-650 flex items-center gap-1 font-extrabold normal-case">
                              <Loader2 size={10} className="animate-spin" /> Fetching...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          className="w-full px-3 py-2 border border-indigo-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-bold"
                          value={newCustomer.pincode}
                          onChange={e => handleNewCustomerPincodeChange(e.target.value)}
                          placeholder="6-digit Pincode"
                          disabled={newCustomerPincodeLoading}
                        />
                      </div>

                      {/* Auto-filled City & State */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          readOnly
                          className={`w-full px-3 py-2 border rounded text-xs font-semibold focus:outline-none ${newCustomer.city ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-250 text-gray-405'}`}
                          value={newCustomer.city}
                          placeholder="Auto-filled"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          required
                          readOnly
                          className={`w-full px-3 py-2 border rounded text-xs font-semibold focus:outline-none ${newCustomer.state ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-250 text-gray-405'}`}
                          value={newCustomer.state}
                          placeholder="Auto-filled"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2.5 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => setIsAddingCustomer(false)}
                        className="px-4 py-2 border border-gray-200 rounded text-xs font-bold uppercase tracking-wider text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustomer}
                        disabled={!newCustomer.city || !newCustomer.pincode || newCustomer.pincode.length !== 6}
                        className="px-6 py-2 border border-transparent rounded text-xs font-bold uppercase tracking-wider text-white bg-indigo-650 hover:bg-indigo-750 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Save Customer
                      </button>
                    </div>
                  </div>
                )}

                {/* Group Cards */}
                {shipmentGroups.map((group) => (
                  <div key={group.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden group/card hover:border-gray-200 transition-all">
                    {/* Group Header */}
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start md:items-center gap-3">
                        <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-full hidden sm:block text-indigo-650">
                          <User size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{group.customer.name}</h4>
                          <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1 font-semibold">
                            <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {group.customer.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {group.customer.phone}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-start gap-1 max-w-lg font-semibold leading-relaxed">
                            <Building2 size={12} className="flex-shrink-0 mt-0.5 text-gray-400" />
                            {group.customer.address}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {group.invoiceUrl ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold uppercase tracking-wider">
                            <CheckCircle size={11} className="text-green-650" /> Delivery Note Generated
                          </span>
                        ) : (
                          <button
                            onClick={() => generateGroupInvoice(group)}
                            className="inline-flex items-center gap-1.2 px-3 py-1.5 border border-indigo-650 hover:bg-indigo-50 text-indigo-650 rounded text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            <FileText size={12} /> Generate Delivery Note
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="Remove Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Group Items */}
                    <div className="px-6 py-4">
                      {group.items.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">No assigned items</p>
                          <p className="text-gray-450 text-[10px] mt-0.5">Select items in the "Unassigned Pool" block above.</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {group.items.map(gi => {
                            const product = cart.find(c => c.product._id === gi.productId)?.product;
                            if (!product) return null;
                            return (
                              <li key={gi.productId} className="py-2.5 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-50 rounded overflow-hidden border border-gray-150 shadow-sm flex-shrink-0">
                                    <img src={product.images?.[0]} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Qty: <strong className="font-extrabold text-gray-900">{gi.quantity}</strong> x ₹{gi.price.toFixed(2)}</p>
                                    {gi.warrantyOption === 'extended' && (
                                      <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1 py-0.2 rounded mt-0.5 inline-block uppercase tracking-wider">+ Extended Warranty</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromGroup(group.id, gi.productId)}
                                  className="text-gray-400 hover:text-red-505 p-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Minus size={12} />
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

          {/* Right Column Summary & Address */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  Order Summary
                </h2>
              </div>

              {/* Summary Details */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-2 text-xs border-b border-gray-50">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    Total Quantity
                  </span>
                  <span className="bg-gray-100 text-gray-800 font-extrabold px-3 py-0.5 rounded-full">
                    {totalItemsCount}
                  </span>
                </div>

                <div className="flex justify-between py-2 text-xs border-b border-gray-50">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider">Subtotal (Before Tax)</span>
                  <span className="font-extrabold text-gray-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-2 text-xs border-b border-gray-50 bg-green-50/50 -mx-6 px-6">
                  <span className="text-green-800 font-bold uppercase tracking-wider">Estimated GST (18% Tax)</span>
                  <span className="font-extrabold text-green-600">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider">Shipping</span>
                  <span className="font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> FREE
                  </span>
                </div>

                {/* grand total */}
                <div className="bg-indigo-50 border border-indigo-100/50 -mx-6 px-6 py-4 flex items-center justify-between rounded-lg">
                  <span className="text-indigo-950 font-bold text-xs uppercase tracking-wider">Order Total</span>
                  <span className="text-xl font-extrabold text-indigo-650">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {shipping === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded p-3 flex items-center gap-2">
                    <CheckCircle className="text-green-650 flex-shrink-0" size={16} />
                    <p className="text-[10px] text-green-755 font-semibold">
                      Saving on shipping! Free courier delivery applied to this purchase.
                    </p>
                  </div>
                )}
              </div>

              {/* Address Form Section */}
              <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-6">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-650" />
                    Shipping Destination
                  </h3>

                  {/* Dropship Toggle for Retailers */}
                  {user?.role === 'retailer' && (
                    <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-600 p-1.5 rounded text-white flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-indigo-955 text-xs uppercase tracking-wide">Dropship to Customer</p>
                          <p className="text-[9px] text-gray-500 font-semibold">Ship directly to customer with no-price invoice</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isDropship}
                          onChange={(e) => setIsDropship(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                      </label>
                    </div>
                  )}

                  {isDropship ? (
                    <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-5 text-center mb-4">
                      <div className="bg-indigo-100/50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5 text-indigo-650">
                        <UserPlus size={20} />
                      </div>
                      <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wide mb-1">Multi-Customer Destination</h4>
                      <p className="text-indigo-805 text-[10px] leading-relaxed font-semibold">
                        Add and configure addresses inside the Customer Shipments section on the left column.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold text-gray-800"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-350 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold text-gray-800"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-350 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold text-gray-800"
                          placeholder="House No, Street name"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-350 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-semibold text-gray-800"
                          placeholder="Optional"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span>Pincode *</span>
                          {pincodeLoading && (
                            <span className="text-[9px] text-indigo-650 flex items-center gap-1 normal-case font-bold">
                              <Loader2 size={10} className="animate-spin" /> Auto-fetching location...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          value={addressForm.pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          className="w-full px-3 py-2 border border-indigo-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-bold"
                          placeholder="Enter 6-digit Pincode"
                          maxLength={6}
                          disabled={pincodeLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            required
                            readOnly
                            value={addressForm.city}
                            className={`w-full px-3 py-2 border rounded text-xs font-semibold focus:outline-none ${addressForm.city ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-250 text-gray-400'}`}
                            placeholder="Auto-filled"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            required
                            readOnly
                            value={addressForm.state}
                            className={`w-full px-3 py-2 border rounded text-xs font-semibold focus:outline-none ${addressForm.state ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-250 text-gray-400'}`}
                            placeholder="Auto-filled"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkout buttons */}
                  <div className="pt-4 border-t border-gray-100 mt-5">
                    {requiresQuote ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 shadow transition-all transform hover:scale-[1.01]"
                        >
                          Request a Quote
                          <ArrowRight size={14} className="ml-2" />
                        </button>
                        <div className="bg-amber-50 border border-amber-100/50 rounded p-3 flex items-start gap-2">
                          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
                          <p className="text-[10px] text-amber-700 font-semibold">
                            Bulk quantities exceed normal limit. Administrator approval is required for special discounts.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent rounded text-xs font-bold uppercase tracking-wider text-white bg-gray-900 hover:bg-gray-800 shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={14} className="mr-2 animate-spin" />
                              Processing payment...
                            </>
                          ) : (
                            <>
                              Proceed to Pay
                              <ArrowRight size={14} className="ml-2" />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => navigate('/quote')}
                          className="w-full flex justify-center items-center px-6 py-3 border border-gray-250 rounded text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <FileText size={14} className="mr-1.5" />
                          Request Custom Quote
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue shopping */}
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500 font-semibold">
                    or{' '}
                    <Link to="/products" className="text-indigo-650 font-bold hover:text-indigo-700 hover:underline transition-colors uppercase tracking-wider text-[10px]">
                      Continue Shopping
                    </Link>
                  </span>
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
