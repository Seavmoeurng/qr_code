let currentSettings = {
    text: "", // Empty initial state
    bodyShape: "square",
    eyeExtShape: "square",
    eyeIntShape: "square",
    errorCorrection: "H",
    colorMode: "single",
    color1: "#000000",
    color2: "#8a2be2",
    bgColor: "#ffffff",
    logoUrl: "",
    logoSize: 0.4,
    hideBgDots: true
};

const qrResult = document.getElementById('qr-result');
const qrPlaceholder = document.getElementById('qr-placeholder');
const downloadBtn = document.getElementById('download-btn');

// Initialize with type: "svg" to fix rendering glitch
const qrCode = new QRCodeStyling({
    width: 250, height: 250, margin: 10, type: "svg"
});
qrCode.append(qrResult);

function updateLivePreview() {
    // 1. Handle Empty State
    if (!currentSettings.text) {
        qrResult.style.display = 'none';
        qrPlaceholder.style.display = 'block';
        downloadBtn.disabled = true;
        return; 
    }

    // 2. Setup for Display
    qrResult.style.display = 'flex';
    qrPlaceholder.style.display = 'none';
    downloadBtn.disabled = false;

    // 3. Configure Appearance
    let dotsOptions = { type: currentSettings.bodyShape };
    if (currentSettings.colorMode === "gradient") {
        dotsOptions.gradient = {
            type: "linear", rotation: Math.PI / 4,
            colorStops: [{ offset: 0, color: currentSettings.color1 }, { offset: 1, color: currentSettings.color2 }]
        };
    } else {
        dotsOptions.color = currentSettings.color1;
    }

    // 4. Trigger Library Update
    qrCode.update({
        data: currentSettings.text,
        image: currentSettings.logoUrl,
        qrOptions: { errorCorrectionLevel: currentSettings.errorCorrection },
        dotsOptions: dotsOptions,
        backgroundOptions: { color: currentSettings.bgColor },
        cornersSquareOptions: { type: currentSettings.eyeExtShape, color: currentSettings.color1 },
        cornersDotOptions: { type: currentSettings.eyeIntShape, color: currentSettings.color1 },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 5,
            imageSize: currentSettings.logoSize,
            hideBackgroundDots: currentSettings.hideBgDots
        }
    });
}
updateLivePreview(); // Run once to set initial empty state

// --- Events: Text & Colors ---
document.getElementById('qr-text').addEventListener('input', (e) => { 
    currentSettings.text = e.target.value.trim(); 
    updateLivePreview(); 
});

document.getElementById('color-dark-1').addEventListener('input', (e) => { 
    currentSettings.color1 = e.target.value; 
    document.getElementById('hex-dark-1').innerText = e.target.value.toUpperCase();
    updateLivePreview(); 
});
document.getElementById('color-dark-2').addEventListener('input', (e) => { 
    currentSettings.color2 = e.target.value; 
    document.getElementById('hex-dark-2').innerText = e.target.value.toUpperCase();
    updateLivePreview(); 
});
document.getElementById('color-light').addEventListener('input', (e) => { 
    currentSettings.bgColor = e.target.value; 
    document.getElementById('hex-light').innerText = e.target.value.toUpperCase();
    updateLivePreview(); 
});

document.querySelectorAll('input[name="color-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentSettings.colorMode = e.target.value;
        document.getElementById('gradient-color-group').style.display = currentSettings.colorMode === 'gradient' ? 'flex' : 'none';
        updateLivePreview();
    });
});

// --- Events: Tab Navigation ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`content-${btn.getAttribute('data-tab')}`).classList.add('active');
    });
});

document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.shape-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`panel-${btn.getAttribute('data-sub')}`).classList.add('active');
    });
});

// --- Events: Shapes & Scannability ---
document.querySelectorAll('.shape-card, .scan-card').forEach(card => {
    card.addEventListener('click', (e) => {
        card.parentNode.querySelectorAll('.shape-card, .scan-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const val = card.getAttribute('data-val');
        if (card.classList.contains('scan-card')) currentSettings.errorCorrection = val;
        else if (card.getAttribute('data-type') === 'body') currentSettings.bodyShape = val;
        else if (card.getAttribute('data-type') === 'eye-ext') currentSettings.eyeExtShape = val;
        else if (card.getAttribute('data-type') === 'eye-int') currentSettings.eyeIntShape = val;
        updateLivePreview();
    });
});

// --- Events: Logo Controls ---
const uploadBox = document.getElementById('upload-box');
const uploadText = document.getElementById('upload-text');
const removeLogoBtn = document.getElementById('remove-logo');

document.getElementById('logo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentSettings.logoUrl = URL.createObjectURL(file);
        uploadText.innerText = file.name;
        uploadBox.classList.add('has-file');
        removeLogoBtn.style.display = 'block';
        updateLivePreview();
    }
});

removeLogoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents file dialog from opening
    currentSettings.logoUrl = "";
    document.getElementById('logo-input').value = "";
    uploadText.innerText = "Upload Custom Logo (PNG, JPEG)";
    uploadBox.classList.remove('has-file');
    removeLogoBtn.style.display = 'none';
    updateLivePreview();
});

document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentSettings.logoUrl = btn.getAttribute('data-url');
        uploadText.innerText = "Social Icon Selected";
        uploadBox.classList.add('has-file');
        removeLogoBtn.style.display = 'block';
        updateLivePreview();
    });
});

document.getElementById('logo-size').addEventListener('input', (e) => { currentSettings.logoSize = parseFloat(e.target.value); updateLivePreview(); });
document.getElementById('logo-bg-toggle').addEventListener('change', (e) => { currentSettings.hideBgDots = e.target.checked; updateLivePreview(); });

// --- Events: Download ---
// downloadBtn.addEventListener('click', () => {
//     const ext = document.getElementById('dl-format').value;
//     const size = parseInt(document.getElementById('dl-size').value);
    
//     // Temporarily resize up to high-res for the download
//     qrCode.update({ width: size, height: size });
    
//     qrCode.download({ name: "qr-code", extension: ext }).then(() => {
//         // Revert back to UI preview size after download finishes
//         qrCode.update({ width: 250, height: 250 });
//     });
// });

// --- Events: Advanced Bug-Free Download ---
downloadBtn.addEventListener('click', () => {
    const ext = document.getElementById('dl-format').value;
    const size = parseInt(document.getElementById('dl-size').value);
    
    // Temporarily resize up to high-res and FORCE svg mode
    qrCode.update({ width: size, height: size, type: "svg" });
    
    // Give the DOM 150ms to redraw the larger SVG before capturing it
    setTimeout(() => {
        if (ext === "svg") {
            // For SVG, the library's native downloader works perfectly
            qrCode.download({ name: "clean-qrcode", extension: "svg" })
                  .then(() => qrCode.update({ width: 250, height: 250 }));
        } else {
            // For PNG/JPEG, bypass the library and use native browser rendering
            const svgElement = document.querySelector('#qr-result svg');
            const xml = new XMLSerializer().serializeToString(svgElement);
            
            // Convert SVG to Base64
            const svg64 = btoa(unescape(encodeURIComponent(xml)));
            const image64 = 'data:image/svg+xml;base64,' + svg64;

            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                
                // If JPEG, fill a white background first so it isn't transparent (black)
                if (ext === "jpeg") {
                    ctx.fillStyle = currentSettings.bgColor || "#ffffff";
                    ctx.fillRect(0, 0, size, size);
                }
                
                // Draw the flawless SVG onto the canvas
                ctx.drawImage(img, 0, 0, size, size);
                
                // Trigger native browser download
                const a = document.createElement("a");
                a.download = `clean-qrcode.${ext}`;
                a.href = canvas.toDataURL(`image/${ext}`);
                a.click();
                
                // Revert back to UI preview size
                qrCode.update({ width: 250, height: 250 });
            };
            img.src = image64;
        }
    }, 150);
});