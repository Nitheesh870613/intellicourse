'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote,
  Plus,
  Save,
  Trash2,
  Pin,
  PinOff,
  Edit2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ModuleNotes({ courseId, moduleId, moduleIndex }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [courseId, moduleId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(
        `/api/notes?courseId=${courseId}&moduleId=${moduleId}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error('Note content is required');
      return;
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId,
          moduleIndex,
          content: newNoteContent,
          title: newNoteTitle || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        setNewNoteContent('');
        setNewNoteTitle('');
        setIsCreating(false);
        toast.success('Note created successfully!');
      } else {
        toast.error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('An error occurred while creating note');
    }
  };

  const handleUpdateNote = async (noteId, updates) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          ...updates
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(notes.map(n => (n.id === noteId ? data.note : n)));
        toast.success('Note updated successfully!');
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('An error occurred while updating note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes?noteId=${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
        toast.success('Note deleted successfully!');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('An error occurred while deleting note');
    }
  };

  const togglePin = (note) => {
    handleUpdateNote(note.id, { isPinned: !note.isPinned });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">My Notes</h3>
          <span className="text-sm text-white/60">({notes.length})</span>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isCreating ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 space-y-3"
          >
            <input
              type="text"
              placeholder="Note title (optional)"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
            />
            <textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setNewNoteContent('');
                  setNewNoteTitle('');
                }}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <StickyNote className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60">No notes yet</p>
            <p className="text-sm text-white/40 mt-1">
              Create your first note for this module
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-xl p-4 space-y-3 ${
                note.isPinned
                  ? 'border-yellow-500/50 bg-yellow-500/5'
                  : 'border-white/10'
              }`}
            >
              {editingNote === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={note.title || ''}
                    onChange={(e) => {
                      const updated = notes.map(n =>
                        n.id === note.id ? { ...n, title: e.target.value } : n
                      );
                      setNotes(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                  <textarea
                    value={note.content}
                    onChange={(e) => {
                      const updated = notes.map(n =>
                        n.id === note.id ? { ...n, content: e.target.value } : n
                      );
                      setNotes(updated);
                    }}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setEditingNote(null);
                        fetchNotes();
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        handleUpdateNote(note.id, {
                          title: note.title,
                          content: note.content
                        });
                        setEditingNote(null);
                      }}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {note.title && (
                        <h4 className="font-semibold text-white mb-2">{note.title}</h4>
                      )}
                      <p className="text-white/80 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    {note.isPinned && (
                      <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-white/40">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => togglePin(note)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {note.isPinned ? (
                          <PinOff className="w-4 h-4" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => setEditingNote(note.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteNote(note.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
