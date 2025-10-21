import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Project {
  title: string;
  description?: string;
  date?: string;
  contributors?: string[];
  image?: string;
  tags?: string[];
  featured?: boolean;
  client?: string;
  url?: string;
  displaySize?: 'narrow' | 'standard' | 'wide' | 'extra-wide';
}

export default function CustomEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentProject, setCurrentProject] = useState<Project>({
    title: '',
    contributors: [],
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // BATCH EDITING STATE
  const [originalProjects, setOriginalProjects] = useState<Project[]>([]); // Snapshot of saved state
  const [dirtyIndices, setDirtyIndices] = useState<Set<number>>(new Set()); // Track which projects changed
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const marqueeRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const textElementRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setOriginalProjects(JSON.parse(JSON.stringify(data.projects || []))); // Deep copy
        if (data.projects && data.projects.length > 0) {
          setCurrentProject(data.projects[0]);
        }
      })
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  // Update current project when selection changes
  useEffect(() => {
    if (projects[selectedIndex]) {
      setCurrentProject(projects[selectedIndex]);
    }
  }, [selectedIndex, projects]);

  // Sync current project changes to projects array
  useEffect(() => {
    if (!projects[selectedIndex]) return;
    const updatedProjects = [...projects];
    updatedProjects[selectedIndex] = currentProject;
    setProjects(updatedProjects);
  }, [currentProject]);

  // Check if current project has unsaved changes
  useEffect(() => {
    if (!originalProjects[selectedIndex]) return;
    
    const isDirty = JSON.stringify(currentProject) !== JSON.stringify(originalProjects[selectedIndex]);
    
    if (isDirty) {
      setDirtyIndices(prev => new Set(prev).add(selectedIndex));
    } else {
      setDirtyIndices(prev => {
        const next = new Set(prev);
        next.delete(selectedIndex);
        return next;
      });
    }
    
    setHasUnsavedChanges(dirtyIndices.size > 0 || isDirty);
  }, [currentProject, originalProjects, selectedIndex, dirtyIndices.size]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+SHIFT+S or CTRL+SHIFT+S - Save
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handleSave();
        }
      }
      
      // CMD+SHIFT+N or CTRL+SHIFT+N - New project
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        handleAddProject();
      }
      
      // CMD+SHIFT+D or CTRL+SHIFT+D - Discard changes
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D' && hasUnsavedChanges) {
        e.preventDefault();
        handleDiscardChanges();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cursor logic
  useEffect(() => {
    if (!marqueeRef.current || !cursorRef.current || !textElementRef.current) return;

    const cursor = cursorRef.current;
    const textElement = textElementRef.current;
    let mouseX = 0;
    let mouseY = 0;
    let animationId: number;

    const moveCursor = (e: MouseEvent) => {
      const rect = marqueeRef.current!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const animateCursor = () => {
      gsap.to(cursor, {
        left: mouseX,
        top: mouseY,
        duration: 0.3,
        ease: 'power2.out'
      });
      animationId = requestAnimationFrame(animateCursor);
    };

    const handleCardEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const title = target.dataset.title || 'Untitled';
      const contributors = target.dataset.contributors?.split(',') || [];
      const year = target.dataset.year || '2024';

      let attribution = '';
      if (contributors.length === 1 && contributors[0]) {
        attribution = ` • ${contributors[0]}`;
      } else if (contributors.length > 1) {
        attribution = ` • ${year}`;
      }

      cursor.classList.add('pill-state');
      textElement.innerHTML = `<strong>${title}</strong>${attribution}`;

      setTimeout(() => {
        const pillWidth = 280 - 24;
        const textWidth = textElement.scrollWidth;
        
        if (textWidth > pillWidth) {
          textElement.classList.add('scrolling');
          const originalHTML = textElement.innerHTML;
          textElement.innerHTML = originalHTML + ' • ' + originalHTML;
        }
      }, 50);

      gsap.to(cursor, {
        width: 280,
        height: 60,
        borderWidth: 2,
        backgroundColor: '#000',
        duration: 0.4,
        ease: 'power3.out'
      });
      gsap.to(textElement, { opacity: 1, duration: 0.3, delay: 0.1 });
    };

    const handleCardLeave = () => {
      cursor.classList.remove('pill-state');
      textElement.classList.remove('scrolling');
      
      const textContent = textElement.textContent || '';
      if (textContent.includes(' • ')) {
        const parts = textContent.split(' • ');
        textElement.innerHTML = parts[0];
      }
      
      gsap.to(cursor, {
        width: 12,
        height: 12,
        borderWidth: 0,
        backgroundColor: '#fff',
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.to(textElement, { opacity: 0, duration: 0.2 });
    };

    const cards = marqueeRef.current.querySelectorAll('.editor-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', handleCardEnter);
      card.addEventListener('mouseleave', handleCardLeave);
    });

    marqueeRef.current.addEventListener('mousemove', moveCursor);
    animateCursor();

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mouseenter', handleCardEnter);
        card.removeEventListener('mouseleave', handleCardLeave);
      });
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [projects, selectedIndex]);

  // Save via GitHub API with progress updates
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('COMMITTING TO GITHUB...');

    console.log('Saving projects:', projects);

    try {
      const response = await fetch('/api/save-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects })
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (response.ok) {
        setSaveStatus('TRIGGERING VERCEL BUILD...');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setOriginalProjects(JSON.parse(JSON.stringify(projects))); // Reset snapshot
        setDirtyIndices(new Set()); // Clear all dirty flags
        setHasUnsavedChanges(false);
        setSaveStatus('✓ SAVED! SITE WILL UPDATE IN ~2 MIN');
        
        setTimeout(() => setSaveStatus(''), 5000);
      } else {
        console.error('Save failed:', data);
        setSaveStatus(`✗ SAVE FAILED: ${data.error || 'Unknown error'}`);
        setTimeout(() => setSaveStatus(''), 5000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus(`✗ SAVE FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProject = () => {
    const newProject: Project = {
      title: 'NEW_PROJECT',
      contributors: [],
      tags: [],
      date: new Date().toISOString()
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setSelectedIndex(projects.length);
    setCurrentProject(newProject);
    
    // Mark new project as dirty
    setDirtyIndices(prev => new Set(prev).add(projects.length));
    setHasUnsavedChanges(true);
  };

  const handleDeleteProject = () => {
    if (confirm('DELETE PROJECT? [Y/N]')) {
      const updatedProjects = projects.filter((_, i) => i !== selectedIndex);
      setProjects(updatedProjects);
      
      // Update dirty indices (shift down indices after deletion)
      const newDirty = new Set<number>();
      dirtyIndices.forEach(idx => {
        if (idx < selectedIndex) {
          newDirty.add(idx);
        } else if (idx > selectedIndex) {
          newDirty.add(idx - 1);
        }
      });
      setDirtyIndices(newDirty);
      
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      setHasUnsavedChanges(newDirty.size > 0);
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('DISCARD ALL CHANGES? [Y/N]')) {
      // Reset to original saved state
      setProjects(JSON.parse(JSON.stringify(originalProjects)));
      setCurrentProject(originalProjects[selectedIndex]);
      setDirtyIndices(new Set());
      setHasUnsavedChanges(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProject({ ...currentProject, image: data.path });
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        alert(`✗ UPLOAD FAILED: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('✗ UPLOAD FAILED');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getYear = (dateString?: string) => {
    if (!dateString) return '2024';
    return new Date(dateString).getFullYear().toString();
  };

  const titleLength = currentProject.title?.length || 0;
  const titleWarning = titleLength > 50;

  return (
    <div className="editor-container">
      {/* Save Status Toast */}
      {saveStatus && (
        <div className="save-status-toast">
          {saveStatus}
        </div>
      )}

      {/* Left Side - Marquee Preview */}
      <div className="editor-preview" ref={marqueeRef}>
        <div className="editor-marquee">
          <div className="editor-card placeholder" />
          <div className="editor-card placeholder" />
          
         <div
            className={`editor-card active size-${currentProject.displaySize || 'standard'}`}
            data-title={currentProject.title}
            data-contributors={currentProject.contributors?.join(',')}
            data-year={getYear(currentProject.date)}
            style={{
              backgroundImage: currentProject.image 
                ? `url(${currentProject.image})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          
          <div className="editor-card placeholder" />
          <div className="editor-card placeholder" />
        </div>

        {/* Custom Cursor */}
        <div ref={cursorRef} className="custom-cursor-editor">
          <div ref={textElementRef} className="cursor-text" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="editor-form">
        <div className="editor-header">
          <h1 className="editor-title">&FRIENDS_EDITOR</h1>
          <div className="editor-subtitle">
            [{selectedIndex + 1}/{projects.length}] PROJECTS
            {hasUnsavedChanges && <span style={{ color: '#ff3b30' }}> • {dirtyIndices.size} UNSAVED</span>}
          </div>
        </div>

        <div className="editor-form-content">
          {/* Project selector */}
          <div className="editor-field">
            <label className="editor-label">SELECT_PROJECT</label>
            <select
              className="editor-select"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
            >
              {projects.map((project, i) => (
                <option key={i} value={i}>
                  {dirtyIndices.has(i) ? '● ' : ''}[{String(i + 1).padStart(2, '0')}] {project.title || `PROJECT_${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="editor-field">
            <label className={`editor-label ${titleWarning ? 'warning' : ''}`}>
              TITLE * {titleWarning && '⚠ TOO_LONG'} [{titleLength}/50]
            </label>
            <input
              type="text"
              className={`editor-input ${titleWarning ? 'error' : ''}`}
              value={currentProject.title}
              onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="editor-field">
            <label className="editor-label">
              DESCRIPTION [{currentProject.description?.length || 0}]
            </label>
            <textarea
              className="editor-textarea"
              rows={4}
              value={currentProject.description || ''}
              onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
            />
          </div>

        {/* Contributors */}
          <div className="editor-field">
            <label className="editor-label">CONTRIBUTORS [COMMA_SEPARATED]</label>
            <input
              type="text"
              className="editor-input"
              value={currentProject.contributors?.join(', ') || ''}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (rawValue.includes(',')) {
                  setCurrentProject({
                    ...currentProject,
                    contributors: rawValue.split(',').map(c => c.trim()).filter(Boolean)
                  });
                } else {
                  setCurrentProject({
                    ...currentProject,
                    contributors: rawValue ? [rawValue] : []
                  });
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !value.includes(',')) {
                  setCurrentProject({
                    ...currentProject,
                    contributors: [value.trim()].filter(Boolean)
                  });
                }
              }}
              placeholder="MASON_THOMPSON, JANE_DOE"
            />
            <div className="editor-hint">
              1_CONTRIBUTOR = SHOWS_NAME | 2+ = SHOWS_YEAR
            </div>
          </div>

          {/* Date */}
          <div className="editor-field">
            <label className="editor-label">DATE</label>
            <input
              type="date"
              className="editor-input"
              value={currentProject.date?.split('T')[0] || ''}
              onChange={(e) => setCurrentProject({
                ...currentProject,
                date: e.target.value ? new Date(e.target.value).toISOString() : undefined
              })}
            />
          </div>

          {/* Featured */}
          <div className="editor-field">
            <label className="editor-label">
              <input
                type="checkbox"
                checked={currentProject.featured || false}
                onChange={(e) => setCurrentProject({ 
                  ...currentProject, 
                  featured: e.target.checked 
                })}
                style={{
                  width: 'auto',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              />
              FEATURED_PROJECT
            </label>
            <div className="editor-hint">
              DISPLAYS AT THE FRONT OF THE MARQUEE
            </div>
          </div>

          {/* Image */}
          <div className="editor-field">
            <label className="editor-label">IMAGE_PATH</label>
            <div 
              className="image-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="upload-status">[UPLOADING...]</div>
              ) : currentProject.image ? (
                <div className="image-preview">
                  <img src={currentProject.image} alt="Preview" />
                  <div className="image-overlay">[CLICK_TO_CHANGE]</div>
                </div>
              ) : (
                <div className="upload-prompt">
                  [CLICK_OR_DROP_IMAGE]
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <input
              type="text"
              className="editor-input"
              value={currentProject.image || ''}
              onChange={(e) => setCurrentProject({ ...currentProject, image: e.target.value })}
              placeholder="/images/project.jpg"
            />
          </div>

          {/* Client */}
          <div className="editor-field">
            <label className="editor-label">CLIENT</label>
            <input
              type="text"
              className="editor-input"
              value={currentProject.client || ''}
              onChange={(e) => setCurrentProject({ ...currentProject, client: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="editor-field">
            <label className="editor-label">TAGS [COMMA_SEPARATED]</label>
            <input
              type="text"
              className="editor-input"
              value={currentProject.tags?.join(', ') || ''}
              onChange={(e) => setCurrentProject({
                ...currentProject,
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              })}
              placeholder="MOTION, INSTALLATION, GRAPHIC"
            />
          </div>

          {/* Display Size */}
          <div className="editor-field">
            <label className="editor-label">DISPLAY_SIZE [ASPECT_RATIO]</label>
            <select
              className="editor-select"
              value={currentProject.displaySize || 'standard'}
              onChange={(e) => setCurrentProject({
                ...currentProject,
                displaySize: e.target.value as 'narrow' | 'standard' | 'wide' | 'extra-wide'
              })}
            >
              <option value="narrow">NARROW [9:16_PORTRAIT]</option>
              <option value="standard">STANDARD [1:1_SQUARE]</option>
              <option value="wide">WIDE [16:9_WIDESCREEN]</option>
              <option value="extra-wide">CINEMASCOPE [2.39:1_ULTRA-WIDE]</option>
            </select>
            <div className="editor-hint">
              CONTROLS_ASPECT_RATIO_IN_MARQUEE
            </div>
          </div>

          {/* Action Buttons */}
          <div className="editor-actions">
            <button
              className="editor-button primary"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? '[SAVING...]' : hasUnsavedChanges ? `[SAVE ${dirtyIndices.size} CHANGE${dirtyIndices.size > 1 ? 'S' : ''}]` : '[NO CHANGES]'}
            </button>
            <button className="editor-button secondary" onClick={handleAddProject}>
              [+]
            </button>
            <button className="editor-button danger" onClick={handleDeleteProject}>
              [DEL]
            </button>
          </div>
          
          {/* Discard button - only show when there are changes */}
          {hasUnsavedChanges && (
            <button
              className="editor-button secondary"
              onClick={handleDiscardChanges}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              [DISCARD ALL CHANGES]
            </button>
          )}

          {/* Info panel */}
          <div className="editor-info">
            <div>BATCH EDITING MODE:</div>
            <div>• EDIT MULTIPLE PROJECTS</div>
            <div>• ONE COMMIT FOR ALL CHANGES</div>
            <div>• DIRTY PROJECTS MARKED WITH ●</div>
            <div style={{ marginTop: '0.5rem' }}>SHORTCUTS:</div>
            <div>CMD+SHIFT+S → SAVE</div>
            <div>CMD+SHIFT+N → NEW_PROJECT</div>
            <div>CMD+SHIFT+D → DISCARD_CHANGES</div>
          </div>
        </div>
      </div>
    </div>
  );
}