'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, File, Code, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToMarkdown, exportToJSON } from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function ExportMenu({ courseData, size = 'sm' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (exportType) => {
    setIsExporting(true);
    try {
      let exportName = '';
      switch (exportType) {
        case 'pdf':
          exportName = 'PDF';
          exportToPDF(courseData);
          toast.success(`Course exported as PDF! Opening print dialog...`);
          break;
        case 'markdown':
          exportName = 'Markdown';
          exportToMarkdown(courseData);
          toast.success(`Course exported as Markdown file!`);
          break;
        case 'json':
          exportName = 'JSON';
          exportToJSON(courseData);
          toast.success(`Course exported as JSON file!`);
          break;
        default:
          throw new Error('Unknown export type');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export course. Please try again.');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const exportOptions = [
    {
      type: 'pdf',
      label: 'PDF Document',
      description: 'Print-ready format',
      icon: FileText,
      color: 'text-red-400',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      type: 'markdown',
      label: 'Markdown',
      description: 'Plain text format',
      icon: Code,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      type: 'json',
      label: 'JSON Data',
      description: 'Structured data',
      icon: File,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    }
  ];

  const buttonSizes = {
    sm: 'h-8 w-8 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-12 w-12 p-0'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`${buttonSizes[size]} bg-white/90 hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700`}
      >
        {isExporting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
        ) : (
          <Download className={iconSizes[size]} />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50"
          >
            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Export Course
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose your preferred format
              </p>
            </div>
            
            <div className="py-1">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    onClick={() => handleExport(option.type)}
                    disabled={isExporting}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${option.bgColor} dark:bg-neutral-700 dark:hover:bg-neutral-600`}
                  >
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {option.label}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {option.description}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-neutral-400 rotate-[-90deg]" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}








