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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-none p-6 shadow-sm border border-blue-700">
        <h2 className="text-xl font-black uppercase tracking-wider mb-2">Content Management Hub</h2>
        <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">
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
              className="bg-white rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer hover:border-slate-400"
            >
              <div className={`${section.color} w-12 h-12 rounded-none flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                {section.title}
              </h3>
              <p className="text-xs text-gray-400 font-semibold uppercase">{section.description}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-none p-6">
        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
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
