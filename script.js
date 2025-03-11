document.addEventListener('DOMContentLoaded', function() {
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
    const htmlEditor = document.getElementById('html-editor');
    const previewBtn = document.getElementById('preview-btn');
    const previewArea = document.getElementById('preview-area');
    const previewIframe = document.getElementById('preview-iframe');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const livePreviewToggle = document.getElementById('live-preview-toggle');
    const iframeToggle = document.getElementById('iframe-toggle');

    // Disable Bootstrap's autofill functionality on the editor
    if (htmlEditor) {
        // Prevent Bootstrap's autofill from interfering
        htmlEditor.setAttribute('autocomplete', 'off');
        htmlEditor.setAttribute('data-bs-no-autofill', 'true');
        
        // Prevent default browser autofill
        htmlEditor.setAttribute('autocorrect', 'off');
        htmlEditor.setAttribute('autocapitalize', 'off');
        htmlEditor.setAttribute('spellcheck', 'false');
    }

    // Function to update preview
    function updatePreview() {
        try {
            // Get the HTML from the editor
            const htmlCode = htmlEditor.value.trim();
            
            // If there's no HTML, show a placeholder message
            if (!htmlCode) {
                previewArea.innerHTML = '<p class="text-muted text-center">Your preview will appear here</p>';
                if (previewIframe) {
                    previewIframe.classList.add('d-none');
                    previewArea.classList.remove('d-none');
                }
                return;
            }
            
            // Check if we should use iframe for preview
            if (iframeToggle && iframeToggle.checked && previewIframe) {
                // Show iframe, hide direct preview
                previewIframe.classList.remove('d-none');
                previewArea.classList.add('d-none');
                
                // Update iframe content
                updateIframeContent(htmlCode);
            } else {
                // Show direct preview, hide iframe
                if (previewIframe) {
                    previewIframe.classList.add('d-none');
                }
                previewArea.classList.remove('d-none');
                
                // Update the preview area with the HTML
                previewArea.innerHTML = htmlCode;
            }
            
            // Add a success message
            showNotification('Preview updated successfully!', 'success');
        } catch (error) {
            // Show error message if something goes wrong
            previewArea.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            if (previewIframe) {
                previewIframe.classList.add('d-none');
            }
            previewArea.classList.remove('d-none');
            showNotification('Error updating preview', 'danger');
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

    // Create a display area for syntax highlighted code
    const codeDisplayArea = document.createElement('div');
    codeDisplayArea.id = 'code-display';
    codeDisplayArea.className = 'mt-3 d-none';
    if (htmlEditor && htmlEditor.parentNode) {
        htmlEditor.parentNode.appendChild(codeDisplayArea);
    }

    // Function to highlight code in the editor
    function highlightCode() {
        if (!htmlEditor) return;
        
        const code = htmlEditor.value;
        if (!code.trim()) {
            codeDisplayArea.classList.add('d-none');
            return;
        }
        
        // Create highlighted HTML
        try {
            const highlightedHtml = hljs.highlight(code, {language: 'xml'}).value;
            codeDisplayArea.innerHTML = `<pre><code class="hljs language-html">${highlightedHtml}</code></pre>`;
            codeDisplayArea.classList.remove('d-none');
        } catch (error) {
            console.error('Error highlighting code:', error);
        }
    }

    // Function to clear the editor
    function clearEditor() {
        if (!htmlEditor) return;
        
        htmlEditor.value = '';
        previewArea.innerHTML = '<p class="text-muted text-center">Your preview will appear here</p>';
        if (previewIframe) {
            previewIframe.classList.add('d-none');
            previewArea.classList.remove('d-none');
            
            // Clear iframe content
            try {
                const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write('');
                iframeDoc.close();
            } catch (error) {
                console.error('Error clearing iframe:', error);
            }
        }
        codeDisplayArea.classList.add('d-none');
        showNotification('Editor cleared', 'info');
    }

    // Function to copy HTML to clipboard
    function copyToClipboard() {
        if (!htmlEditor) return;
        
        const htmlCode = htmlEditor.value.trim();
        
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

    // Safely add event listeners
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
    
    // Live preview toggle
    if (livePreviewToggle) {
        livePreviewToggle.addEventListener('change', function() {
            if (this.checked) {
                showNotification('Live preview enabled', 'info');
                if (htmlEditor && htmlEditor.value.trim()) {
                    updatePreview();
                }
            } else {
                showNotification('Live preview disabled', 'info');
            }
        });
    }
    
    // Iframe toggle
    if (iframeToggle) {
        iframeToggle.addEventListener('change', function() {
            if (this.checked) {
                showNotification('Iframe preview enabled', 'info');
            } else {
                showNotification('Iframe preview disabled', 'info');
            }
            // Update preview to reflect the change
            if (htmlEditor && htmlEditor.value.trim()) {
                updatePreview();
            }
        });
    }
    
    // Live preview as you type (with debounce)
    let debounceTimer;
    if (htmlEditor) {
        htmlEditor.addEventListener('input', function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                highlightCode();
                // Update preview if live preview is enabled
                if (livePreviewToggle && livePreviewToggle.checked) {
                    updatePreview();
                }
            }, 300);
        });
    }

    // Add some example HTML to get started
    if (htmlEditor) {
        htmlEditor.value = '<div class="example">\n  <h2>Hello World</h2>\n  <p>This is a sample HTML tag.</p>\n  <button class="btn btn-primary">Click Me</button>\n</div>';
    }
    
    // Initial preview and highlighting
    updatePreview();
    highlightCode();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only process shortcuts if the editor exists
        if (!htmlEditor) return;
        
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
        
        // Escape to clear
        if (e.key === 'Escape') {
            // Only clear if the editor is focused
            if (document.activeElement === htmlEditor) {
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
