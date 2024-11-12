// Load API key from config
const GEMINI_API_KEY = config.GEMINI_API_KEY;
console.log('API Key loaded:', GEMINI_API_KEY ? 'Present' : 'Missing');

// DOM elements
const imageInput = document.getElementById('imageInput');
const generateBtn = document.getElementById('generateBtn');
const promptOutput = document.getElementById('promptOutput');
const apiKeyInput = document.getElementById('apiKeyInput');
const imagePreview = document.getElementById('imagePreview');
const copyBtn = document.getElementById('copyBtn');

// Function to encode image to base64
function encodeImageToBase64(file) {
    console.log('Encoding image to base64');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            console.log('Image encoded successfully');
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = error => {
            console.error('Error encoding image:', error);
            reject(error);
        };
    });
}

// Function to generate prompt using Gemini API
async function generatePrompt(imageBase64, progressCallback) {
    const apiKey = config.GEMINI_API_KEY;
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: "Generate a detailed prompt describing this image for use in text-to-image AI models:" },
                    { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                ]
            }
        ]
    };

    progressCallback(20); // Start progress

    try {
        console.log('Sending request to Gemini API');
        console.log('API URL:', apiUrl);
        console.log('API Key (first 5 chars):', apiKey.substring(0, 5));

        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        progressCallback(60); // Update progress after fetch

        if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            const responseText = await response.text();
            console.error('Response body:', responseText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const data = await response.json();
        console.log('Received response from Gemini API');

        progressCallback(100); // Complete progress

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error in generatePrompt:', error);
        throw error;
    }
}

// Function to display image preview
function displayImagePreview(file) {
    console.log('Displaying image preview');
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);
        console.log('Image preview displayed');
    }
    reader.readAsDataURL(file);
}

// Event listener for file input
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
        displayImagePreview(file);
    }
});

// Event listener for generate button
generateBtn.addEventListener('click', async () => {
    console.log('Generate button clicked');
    const file = imageInput.files[0];
    if (!file) {
        console.warn('No file selected');
        alert('Please select an image first.');
        return;
    }

    try {
        console.log('Processing image');
        showProcessingBar();
        const imageBase64 = await encodeImageToBase64(file);
        console.log('Generating prompt');
        const generatedPrompt = await generatePrompt(imageBase64, updateProcessingBar);
        console.log('Prompt generated:', generatedPrompt);
        promptOutput.textContent = generatedPrompt;
    } catch (error) {
        console.error('Error in generate button click handler:', error);
        promptOutput.textContent = `An error occurred: ${error.message}. Please check the console for more details and ensure your API key is correct.`;
    } finally {
        hideProcessingBar();
    }
});

// Event listener for copy button
copyBtn.addEventListener('click', () => {
    console.log('Copy button clicked');
    const promptText = promptOutput.textContent;
    if (promptText) {
        navigator.clipboard.writeText(promptText)
            .then(() => {
                console.log('Prompt copied to clipboard');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy prompt:', err);
                alert('Failed to copy prompt. Please try again.');
            });
    } else {
        console.warn('No prompt to copy');
        alert('No prompt to copy. Generate a prompt first.');
    }
});

function showProcessingBar() {
    const processingBar = document.getElementById('processingBar');
    processingBar.style.display = 'block';
    updateProcessingBar(0);
}

function hideProcessingBar() {
    const processingBar = document.getElementById('processingBar');
    processingBar.style.display = 'none';
}

function updateProcessingBar(progress) {
    const progressElement = document.querySelector('.processing-bar .progress');
    progressElement.style.width = `${progress}%`;
}

async function simulateProcessing() {
    for (let i = 0; i <= 100; i += 10) {
        updateProcessingBar(i);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}
