const uploadButton = document.getElementById('upload-button');
const imageUpload = document.getElementById('image-upload');
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const closeLightbox = document.getElementById('close-lightbox');
const editModal = document.getElementById('edit-modal');
const closeEditModal = document.getElementById('close-edit-modal');
const saveEditButton = document.getElementById('save-edit');
const newFilenameInput = document.getElementById('new-filename');
let currentImageUrl = '';

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) {
    console.error('Notification element not found!');
    return;
  }
  notification.textContent = message;
  notification.className = 'notification'; // Reset class
  notification.classList.add(type); // Add type class (success, error, warning, info)
  notification.style.display = 'block';

  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => {
      notification.style.display = 'none';
      notification.classList.remove('hide');
    }, 300); // Wait for the animation to finish
  }, 3000);
}

// Fetch and display images with pagination
async function fetchImages(page = 1, limit = 10) {
  try {
    gallery.innerHTML = '<p>Loading images...</p>'; // Show loading message
    const response = await fetch(`http://localhost:5000/images?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    gallery.innerHTML = ''; // Clear loading message

    // Display images
    data.fileUrls.forEach((url) => {
      const imgContainer = document.createElement('div');
      imgContainer.classList.add('image-container');

      const img = document.createElement('img');
      img.src = url;
      img.alt = "Gallery image"; // Add alt text for accessibility
      imgContainer.appendChild(img);

      // Add Edit button
      const editButton = document.createElement('button');
      editButton.innerText = 'Edit';
      editButton.classList.add('edit-button');
      imgContainer.appendChild(editButton);

      // Add Delete button
      const deleteButton = document.createElement('button');
      deleteButton.innerText = 'Delete';
      deleteButton.classList.add('delete-button');
      imgContainer.appendChild(deleteButton);

      gallery.appendChild(imgContainer);
    });

    // Update pagination controls
    updatePaginationControls(data.currentPage, data.totalPages);
  } catch (error) {
    showNotification('Error fetching images', 'error');
    console.error('Error fetching images:', error);
  }
}

// Update pagination controls
function updatePaginationControls(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) {
    console.error('Pagination container not found!');
    return;
  }
  paginationContainer.innerHTML = ''; // Clear existing controls

  // Previous Button
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.innerText = 'Previous';
    prevButton.addEventListener('click', () => {
      fetchImages(currentPage - 1);
    });
    paginationContainer.appendChild(prevButton);
  }

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.innerText = i;
    if (i === currentPage) {
      pageButton.disabled = true; // Disable the current page button
    }
    pageButton.addEventListener('click', () => {
      fetchImages(i);
    });
    paginationContainer.appendChild(pageButton);
  }

  // Next Button
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.innerText = 'Next';
    nextButton.addEventListener('click', () => {
      fetchImages(currentPage + 1);
    });
    paginationContainer.appendChild(nextButton);
  }
}

// Open lightbox with clicked image
function openLightbox(imageUrl) {
  lightboxImage.src = imageUrl;
  lightbox.style.display = 'flex';
}

// Close lightbox
closeLightbox.addEventListener('click', () => {
  lightbox.style.display = 'none';
});

// Close lightbox on Escape key press
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox.style.display === 'flex') {
    lightbox.style.display = 'none';
  }
});

// Open edit modal
function openEditModal(imageUrl) {
  currentImageUrl = imageUrl;
  editModal.style.display = 'flex';
}

// Close edit modal
closeEditModal.addEventListener('click', () => {
  editModal.style.display = 'none';
  newFilenameInput.value = ''; // Clear the input field
});

// Close modal when clicking outside the modal content
editModal.addEventListener('click', (event) => {
  if (event.target === editModal) {
    editModal.style.display = 'none';
    newFilenameInput.value = ''; // Clear the input field
  }
});

// Save edited filename
saveEditButton.addEventListener('click', async () => {
  const newFilename = newFilenameInput.value.trim();
  if (!newFilename) {
    showNotification('Please enter a new filename', 'error');
    return;
  }

  // Ensure the filename has an extension
  if (!newFilename.includes('.')) {
    showNotification('Please include a file extension (e.g., .jpg, .png)', 'error');
    return;
  }

  const filename = currentImageUrl.split('/').pop(); // Extract filename from URL

  try {
    const response = await fetch(`http://localhost:5000/images/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newFilename }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    showNotification('Image updated successfully!', 'success');
    fetchImages(); // Refresh the gallery
    editModal.style.display = 'none'; // Close the modal
    newFilenameInput.value = ''; // Clear the input field
  } catch (error) {
    showNotification('Failed to update image', 'error');
    console.error('Error updating image:', error);
  }
});

// Upload images to the backend
uploadButton.addEventListener('click', () => {
  imageUpload.click();
});

imageUpload.addEventListener('change', async (event) => {
  const files = event.target.files;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Add more if needed

  for (let i = 0; i < files.length; i++) {
    if (!allowedTypes.includes(files[i].type)) {
      showNotification('Only image files (JPEG, PNG, GIF) are allowed.', 'error');
      return;
    }
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    showNotification('Images uploaded successfully!', 'success');
    fetchImages(); // Refresh the gallery after upload
  } catch (error) {
    showNotification('Error uploading images', 'error');
    console.error('Error uploading images:', error);
  }
});

// Event delegation for Edit buttons
gallery.addEventListener('click', (event) => {
  if (event.target.classList.contains('edit-button')) {
    const imageUrl = event.target.closest('.image-container').querySelector('img').src;
    openEditModal(imageUrl);
  }
});

// Event delegation for Delete buttons
gallery.addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-button')) {
    const imageUrl = event.target.closest('.image-container').querySelector('img').src;
    const filename = imageUrl.split('/').pop();
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await fetch(`http://localhost:5000/images/${filename}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        showNotification('Image deleted successfully!', 'success');
        fetchImages(); // Refresh the gallery
      } catch (error) {
        showNotification('Failed to delete image', 'error');
        console.error('Error deleting image:', error);
      }
    }
  }
});

// Event delegation for gallery images (lightbox)
gallery.addEventListener('click', (event) => {
  if (event.target.tagName === 'IMG') {
    openLightbox(event.target.src);
  }
});

// Load images when the page loads
fetchImages(1, 10); // Default to page 1 and 10 images per page