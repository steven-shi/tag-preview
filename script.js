document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('html-editor'), {
        mode: 'htmlmixed',
        theme: 'eclipse',
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        viewportMargin: Infinity,
        extraKeys: {
            'Ctrl-Enter': function(cm) {
                updatePreview();
            },
            'Ctrl-S': function(cm) {
                formatEditorContent();
            }
        }
    });

    // Initialize Split.js for resizable panels
    const split = Split(['#editor-container', '#preview-container'], {
        sizes: [50, 50],
        minSize: [300, 300],
        gutterSize: 10,
        snapOffset: 30,
        direction: 'horizontal',
        elementStyle: function(dimension, size, gutterSize) {
            return {
                'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
            };
        },
        gutterStyle: function(dimension, gutterSize) {
            return {
                'flex-basis': gutterSize + 'px'
            };
        }
    });

    // Get DOM elements
    const previewBtn = document.getElementById('preview-btn');
    const previewIframe = document.getElementById('preview-iframe');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const formatBtn = document.getElementById('format-btn');
    const livePreviewToggle = document.getElementById('live-preview-toggle');

    // Function to format HTML code
    function formatHTML(code) {
        try {
            return prettier.format(code, {
                parser: "html",
                plugins: prettierPlugins,
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                semi: true,
                singleQuote: false,
                bracketSameLine: false,
                htmlWhitespaceSensitivity: "css"
            });
        } catch (error) {
            console.error('Prettier formatting error:', error);
            return code; // Return original code if formatting fails
        }
    }

    // Function to format the editor content
    function formatEditorContent() {
        const code = editor.getValue().trim();
        if (!code) {
            showNotification('Nothing to format', 'warning');
            return;
        }

        try {
            const formattedCode = formatHTML(code);
            editor.setValue(formattedCode);
            showNotification('HTML formatted successfully!', 'success');
        } catch (error) {
            console.error('Formatting error:', error);
            showNotification('Error formatting HTML', 'danger');
        }
    }

    // Function to update preview
    function updatePreview() {
        try {
            // Get the HTML from the editor
            const htmlCode = editor.getValue().trim();
            
            // If there's no HTML, show a placeholder message
            if (!htmlCode) {
                updateIframeContent('<p class="text-muted text-center">Your preview will appear here</p>');
                return;
            }
            
            // Update iframe content
            updateIframeContent(htmlCode);
            
            // Add a success message
            showNotification('Preview updated successfully!', 'success');
        } catch (error) {
            showNotification('Error updating preview', 'danger');
            console.error('Preview error:', error);
        }
    }

    // Function to update iframe content
    function updateIframeContent(htmlCode) {
        if (!previewIframe) return;
        
        try {
            // Create a complete HTML document
            const completeHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ad Preview</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                        }
                    </style>
                </head>
                <body>
                    ${htmlCode}
                </body>
                </html>
            `;
            
            // Access the iframe document
            const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            
            // Write the HTML to the iframe
            iframeDoc.open();
            iframeDoc.write(completeHtml);
            iframeDoc.close();
        } catch (error) {
            console.error('Error updating iframe:', error);
            showNotification('Error updating iframe preview', 'danger');
        }
    }

    // Function to show notification
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
        notification.style.zIndex = '1050';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    // Function to clear the editor
    function clearEditor() {
        editor.setValue('');
        updateIframeContent('<p class="text-muted text-center">Your preview will appear here</p>');
        showNotification('Editor cleared', 'info');
    }

    // Function to copy HTML to clipboard
    function copyToClipboard() {
        const htmlCode = editor.getValue().trim();
        
        if (!htmlCode) {
            showNotification('Nothing to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(htmlCode)
            .then(() => {
                showNotification('HTML copied to clipboard!', 'success');
            })
            .catch(err => {
                showNotification('Failed to copy: ' + err, 'danger');
            });
    }

    // Add event listeners
    if (previewBtn) {
        previewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updatePreview();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearEditor();
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyToClipboard();
        });
    }
    
    if (formatBtn) {
        formatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            formatEditorContent();
        });
    }
    
    // Live preview toggle
    if (livePreviewToggle) {
        livePreviewToggle.addEventListener('change', function() {
            if (this.checked) {
                showNotification('Live preview enabled', 'info');
                updatePreview();
            } else {
                showNotification('Live preview disabled', 'info');
            }
        });
    }
    
    // Live preview as you type (with debounce)
    let debounceTimer;
    editor.on('change', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (livePreviewToggle && livePreviewToggle.checked) {
                updatePreview();
            }
        }, 300);
    });

    // Add some example HTML to get started
    editor.setValue('<div class="example">\n  <h2>Hello World</h2>\n  <p>This is a sample HTML tag.</p>\n  <button class="btn btn-primary">Click Me</button>\n</div>');
    
    // Initial preview
    updatePreview();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only process shortcuts if the editor exists
        if (!editor) return;
        
        // Ctrl+Enter to preview
        if (e.ctrlKey && e.key === 'Enter') {
            updatePreview();
            e.preventDefault();
        }
        
        // Ctrl+Shift+C to copy
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            copyToClipboard();
            e.preventDefault();
        }
        
        // Ctrl+Shift+F to format
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            formatEditorContent();
            e.preventDefault();
        }
        
        // Escape to clear
        if (e.key === 'Escape') {
            // Only clear if the editor is focused
            if (document.activeElement === editor.getWrapperElement()) {
                clearEditor();
                e.preventDefault();
            }
        }
    });
    
    // Handle window resize to reinitialize Split.js if needed
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            // Mobile view - no need for Split.js
            if (split && typeof split.destroy === 'function') {
                split.destroy();
            }
        } else if (!split.pairs || split.pairs.length === 0) {
            // Desktop view - reinitialize Split.js if it was destroyed
            try {
                split = Split(['#editor-container', '#preview-container'], {
                    sizes: [50, 50],
                    minSize: [300, 300],
                    gutterSize: 10,
                    snapOffset: 30,
                    direction: 'horizontal',
                    elementStyle: function(dimension, size, gutterSize) {
                        return {
                            'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
                        };
                    },
                    gutterStyle: function(dimension, gutterSize) {
                        return {
                            'flex-basis': gutterSize + 'px'
                        };
                    }
                });
            } catch (error) {
                console.error('Error reinitializing Split.js:', error);
            }
        }
    });
}); 
