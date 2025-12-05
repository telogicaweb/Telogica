import React from 'react';
import {
  FileText,
  Users,
  Calendar,
  BarChart3,
  Newspaper,
  Settings,
} from 'lucide-react';

interface ContentManagementProps {
  onNavigate?: (section: string) => void;
}

const ContentManagement: React.FC<ContentManagementProps> = ({
  onNavigate,
}) => {
  const contentSections = [
    {
      id: 'blogs',
      title: 'Blog Management',
      description: 'Create and manage blog posts',
      icon: Newspaper,
      color: 'bg-blue-100 text-blue-600',
      action: () => onNavigate?.('blogs'),
    },
    {
      id: 'team',
      title: 'Team Management',
      description: 'Manage team member profiles',
      icon: Users,
      color: 'bg-green-100 text-green-600',
      action: () => onNavigate?.('team'),
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Create and manage events',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
      action: () => onNavigate?.('events'),
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View and generate reports',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600',
      action: () => onNavigate?.('reports'),
    },
    {
      id: 'pages',
      title: 'Static Pages',
      description: 'Manage static content pages',
      icon: FileText,
      color: 'bg-pink-100 text-pink-600',
      action: () => onNavigate?.('pages'),
    },
    {
      id: 'settings',
      title: 'Content Settings',
      description: 'Configure content preferences',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600',
      action: () => onNavigate?.('settings'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Content Management Hub</h2>
        <p className="text-blue-100">
          Manage all your website content from one central location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              onClick={section.action}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100 hover:border-blue-300"
            >
              <div className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-2">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Use Blog Management to publish news and updates</li>
          <li>• Keep your Team page current with member profiles</li>
          <li>• Schedule Events to keep customers informed</li>
          <li>• Generate Reports to analyze content performance</li>
          <li>• Manage Static Pages for important information</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentManagement;
