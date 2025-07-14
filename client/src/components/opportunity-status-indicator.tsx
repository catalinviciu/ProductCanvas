import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TreeNode, OpportunityWorkflowStatus } from '@shared/schema';

interface OpportunityStatusIndicatorProps {
  node: TreeNode;
  onStatusChange: (status: OpportunityWorkflowStatus) => void;
  disabled?: boolean;
  className?: string;
}

export const statusConfig = {
  identified: { 
    label: 'Identified', 
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    textColor: 'text-blue-800',
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe'
  },
  later: { 
    label: 'Later', 
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
    textColor: 'text-gray-800',
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb'
  },
  next: { 
    label: 'Next', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    textColor: 'text-yellow-800',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a'
  },
  now: { 
    label: 'Now', 
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    textColor: 'text-green-800',
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0'
  },
  done: { 
    label: 'Done', 
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    textColor: 'text-purple-800',
    backgroundColor: '#f3e8ff',
    borderColor: '#ddd6fe'
  },
  trash: { 
    label: 'Trash', 
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    textColor: 'text-red-800',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca'
  }
};

export const OpportunityStatusIndicator: React.FC<OpportunityStatusIndicatorProps> = ({
  node,
  onStatusChange,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = node.templateData?.workflowStatus || 'identified';
  const config = statusConfig[currentStatus];

  const handleStatusSelect = (status: OpportunityWorkflowStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`
            ${config.color} 
            border 
            px-2 
            py-1 
            h-auto 
            text-xs 
            font-medium 
            rounded-md 
            transition-colors 
            duration-200
            ${className}
          `}
        >
          {config.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {Object.entries(statusConfig).map(([status, config]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusSelect(status as OpportunityWorkflowStatus)}
            className="cursor-pointer"
          >
            <Badge 
              variant="secondary" 
              className={`${config.color} mr-2 text-xs`}
            >
              {config.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};