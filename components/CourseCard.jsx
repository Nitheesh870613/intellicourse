'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Zap, Play, Layers, Gauge, MoreVertical, Trash2, Code, Heart, Palette, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ExportMenu from './ExportMenu';
import { getCategoryConfig } from '@/lib/utils/categoryThumbnails';
import { toast } from 'sonner';

export default function CourseCard({ course, onDelete }) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef(null);

	const created = course.createdAt ? new Date(course.createdAt).toLocaleDateString() : '';
	const difficulty = course.difficulty || 'Beginner';

	// Get category configuration
	const category = course.category?.toLowerCase() || 'programming';
	const categoryConfig = getCategoryConfig(category);

	// Map category to icon component
	const getCategoryIcon = () => {
		const iconMap = {
			programming: Code,
			health: Heart,
			creative: Palette,
			business: BookOpen,
			science: Brain,
			technology: Zap
		};
		return iconMap[category] || Code;
	};

	const CategoryIcon = getCategoryIcon();

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowMenu(false);
			}
		};

		if (showMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showMenu]);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/courses/${course.id}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				onDelete?.(course.id);
				setShowDeleteDialog(false);
				toast.success('Course deleted successfully');
			} else {
				console.error('Failed to delete course');
				toast.error('Failed to delete course');
			}
		} catch (error) {
			console.error('Error deleting course:', error);
			toast.error('An error occurred while deleting');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="group relative">
			<Card className="relative overflow-visible border-0 shadow-lg transition-all duration-300 hover:shadow-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl">
				{/* Options Menu Button */}
				<div className="absolute top-3 right-3 z-30" ref={menuRef}>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setShowMenu(!showMenu);
						}}
					>
						<MoreVertical className="h-4 w-4 text-white" />
					</Button>

					{/* Dropdown Menu */}
					{showMenu && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-40"
						>
							<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Export</span>
									<ExportMenu courseData={course} size="sm" />
								</div>
							</div>
							<button
								className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-800/20 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setShowMenu(false);
									setShowDeleteDialog(true);
								}}
							>
								<Trash2 className="h-4 w-4" />
								Delete Course
							</button>
						</motion.div>
					)}
				</div>

				<Link href={`/course/${course.id}`} className="block">
					{/* Gradient Header with Icon */}
					<div
						className="relative h-32 overflow-hidden border border-white/15 backdrop-blur-md rounded-t-2xl"
						style={{
							// Apply category tint with ~20% alpha using 8-digit hex (RRGGBBAA)
							background: `linear-gradient(135deg, ${categoryConfig.colors.from}33 0%, ${categoryConfig.colors.to}33 100%)`
						}}
					>
						{/* Category Text */}
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-white text-sm font-semibold uppercase tracking-wider">
								{category}
							</span>
						</div>

						{/* White Circular Badge with Icon - Top Left */}
						<div className="absolute top-4 left-4 z-10">
							<div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
								<CategoryIcon className="w-8 h-8" style={{ color: categoryConfig.colors.from }} />
							</div>
						</div>
					</div>

					{/* Card Content */}
					<CardContent className="p-6 bg-white/85 dark:bg-neutral-900/70 backdrop-blur-lg">
						{/* Title - Large white bold text */}
						<h3 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900 dark:text-white">
							{course.title}
						</h3>

						{/* Description */}
						<p className="mb-5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
							{course.description || 'No description available'}
						</p>

						{/* Metadata */}
						<div className="mb-5 space-y-2">
							<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
								<Clock className="h-4 w-4" />
								<span>Created {created}</span>
							</div>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
							<span className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white">
								{difficulty}
							</span>
							<div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
								<span>View Course</span>
								<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
							</div>
						</div>
					</CardContent>
				</Link>
			</Card>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmationDialog
				isOpen={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDelete}
				courseTitle={course.title}
				isLoading={isDeleting}
			/>
		</motion.div>
	);
}
