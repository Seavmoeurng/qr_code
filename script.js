let currentSettings = {
    text: "", 
    bodyShape: "classy", 
    eyeExtShape: "extra-rounded",
    eyeIntShape: "extra-rounded",
    errorCorrection: "H",
    colorMode: "single",
    color1: "#000000",
    color2: "#8a2be2",
    bgColor: "#ffffff",
    logoUrl: "",
    logoSize: 0.3,
    hideBgDots: true,
    margin: 5 // Default margin
};

const qrResult = document.getElementById('qr-result');
const qrPlaceholder = document.getElementById('qr-placeholder');
const downloadBtn = document.getElementById('download-btn');

// Force SVG rendering for infinite vector crispness
const qrCode = new QRCodeStyling({
    width: 250, height: 250, margin: 0, type: "svg"
});
qrCode.append(qrResult);

// --- Apply Smooth Extra-Rounded Corners to Internal Eyes ---
function applyExtraRoundedInnerEye(targetSvg) {
    const svg = targetSvg || document.querySelector('#qr-result svg');
    if (!svg) return;
    
    if (currentSettings.eyeIntShape === 'extra-rounded') {
        const dotRects = svg.querySelectorAll('clipPath[id*="corners-dot"] rect, rect[clip-path*="corners-dot"]');
        dotRects.forEach(rect => {
            const w = parseFloat(rect.getAttribute('width') || '0');
            const h = parseFloat(rect.getAttribute('height') || '0');
            const size = Math.max(w, h);
            if (size > 0) {
                const r = (size * 0.35).toFixed(2); // 35% radius creates the ideal curved corner look
                rect.setAttribute('rx', r);
                rect.setAttribute('ry', r);
            }
        });
    }
}

// --- Fit SVG ViewBox to Exact Margin Matching Reference QR (2.85% margin / 28.5px on 1000px) ---
function fitSvgViewBox(targetSvg) {
    const svg = targetSvg || document.querySelector('#qr-result svg');
    if (!svg || !qrCode._qr) return;
    
    const n = qrCode._qr.getModuleCount();
    const a = Math.floor(250 / n);
    const matrixSize = n * a;
    const offset = Math.floor((250 - matrixSize) / 2);
    
    // Exactly matches the reference image: 28.5px margin on a 1000px image (2.85% margin, 94.3% matrix)
    const m = matrixSize * (28.5 / 943);
    const vbX = offset - m;
    const vbY = offset - m;
    const vbSize = matrixSize + 2 * m;
    
    svg.setAttribute('viewBox', `${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbSize.toFixed(2)} ${vbSize.toFixed(2)}`);
    
    // Ensure the background elements cover the entire visible area
    const bgElements = svg.querySelectorAll('clipPath[id*="background-color"] rect, rect[clip-path*="background-color"]');
    bgElements.forEach(bg => {
        bg.setAttribute('x', vbX.toFixed(2));
        bg.setAttribute('y', vbY.toFixed(2));
        bg.setAttribute('width', vbSize.toFixed(2));
        bg.setAttribute('height', vbSize.toFixed(2));
    });
}

// Hook into the library's native lifecycle extension to guarantee execution
qrCode.applyExtension((svg) => {
    applyExtraRoundedInnerEye(svg);
    fitSvgViewBox(svg);
});

function updateLivePreview() {
    if (!currentSettings.text) {
        qrResult.style.display = 'none';
        qrPlaceholder.style.display = 'block';
        downloadBtn.disabled = true;
        return;
    }
    qrResult.style.display = 'flex';
    qrPlaceholder.style.display = 'none';
    downloadBtn.disabled = false;

    // Setup colors & gradients
    let dotsOptions = { type: currentSettings.bodyShape };
    let cornerSquareGradient = null;
    let cornerDotGradient = null;

    if (currentSettings.colorMode === "gradient") {
        const gradientConfig = {
            type: "linear",
            rotation: Math.PI / 4,
            colorStops: [
                { offset: 0, color: currentSettings.color1 },
                { offset: 1, color: currentSettings.color2 }
            ]
        };
        dotsOptions.gradient = gradientConfig;
        cornerSquareGradient = gradientConfig;
        cornerDotGradient = gradientConfig;
    } else {
        dotsOptions.color = currentSettings.color1;
    }

    // Handle our 'extra-rounded' state
    let dotType = currentSettings.eyeIntShape;
    if (dotType === 'extra-rounded') {
        dotType = 'square'; // Force standard squares so the extension curves them via rx/ry
    }

    const cornersSquareOptions = {
        type: currentSettings.eyeExtShape,
        color: currentSettings.colorMode === 'single' ? currentSettings.color1 : undefined,
        gradient: cornerSquareGradient || undefined
    };

    const cornersDotOptions = {
        type: dotType,
        color: currentSettings.colorMode === 'single' ? currentSettings.color1 : undefined,
        gradient: cornerDotGradient || undefined
    };

    // Generate/update the standard QR code
    qrCode.update({
        data: currentSettings.text,
        margin: 0, // Managed via viewBox for precise pixel-level edge stretching
        image: currentSettings.logoUrl || undefined,
        qrOptions: { errorCorrectionLevel: currentSettings.errorCorrection },
        dotsOptions: dotsOptions,
        backgroundOptions: { color: currentSettings.bgColor },
        cornersSquareOptions: cornersSquareOptions,
        cornersDotOptions: cornersDotOptions,
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 5,
            imageSize: currentSettings.logoSize,
            hideBackgroundDots: currentSettings.hideBgDots
        }
    });

    // Immediate fallback execution
    applyExtraRoundedInnerEye();
    fitSvgViewBox();
}

updateLivePreview(); 

// --- Event Listeners (Inputs & Colors) ---
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

// --- Event Listeners (Tabs & Shapes) ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`content-${btn.getAttribute('data-tab')}`).classList.add('active');
    });
});

document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn, .shape-panel').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`panel-${btn.getAttribute('data-sub')}`).classList.add('active');
    });
});

document.querySelectorAll('.shape-card, .scan-card').forEach(card => {
    card.addEventListener('click', () => {
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

// --- Event Listeners (Logo Upload with Embedded Base64) ---
const uploadBox = document.getElementById('upload-box');
const uploadText = document.getElementById('upload-text');
const removeLogoBtn = document.getElementById('remove-logo');

document.getElementById('logo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentSettings.logoUrl = event.target.result;
            uploadText.innerText = file.name;
            uploadBox.classList.add('has-file');
            removeLogoBtn.style.display = 'block';
            updateLivePreview();
        };
        reader.readAsDataURL(file);
    }
});

removeLogoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentSettings.logoUrl = "";
    document.getElementById('logo-input').value = "";
    uploadText.innerText = "Upload Custom Logo";
    uploadBox.classList.remove('has-file');
    removeLogoBtn.style.display = 'none';
    updateLivePreview();
});

document.getElementById('logo-size').addEventListener('input', (e) => { 
    currentSettings.logoSize = parseFloat(e.target.value); 
    updateLivePreview(); 
});

document.getElementById('logo-bg-toggle').addEventListener('change', (e) => { 
    currentSettings.hideBgDots = e.target.checked; 
    updateLivePreview(); 
});

// --- High-Resolution Vector & Raster Download Engine ---
downloadBtn.addEventListener('click', () => {
    const ext = document.getElementById('dl-format').value;
    const size = parseInt(document.getElementById('dl-size').value, 10);
    
    const originalSvg = document.querySelector('#qr-result svg');
    if (!originalSvg) return;
    
    // Clone to prevent modifying the live preview layout
    const svgClone = originalSvg.cloneNode(true);
    
    // Ensure standard SVG XML namespaces are present for standalone vector file compatibility
    if (!svgClone.getAttribute('xmlns')) {
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!svgClone.getAttribute('xmlns:xlink')) {
        svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    // Set target high-res dimensions
    svgClone.setAttribute('width', size);
    svgClone.setAttribute('height', size);
    
    // Apply extra-rounded eye styling and tight-fit viewBox to the clone
    applyExtraRoundedInnerEye(svgClone);
    fitSvgViewBox(svgClone);
    
    const xml = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    if (ext === "svg") {
        const a = document.createElement("a");
        a.download = "custom-qr.svg";
        a.href = blobUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } else {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            
            // Fill solid background for JPEG or if bgColor is defined
            if (ext === "jpeg" || currentSettings.bgColor) {
                ctx.fillStyle = currentSettings.bgColor || "#ffffff";
                ctx.fillRect(0, 0, size, size);
            }
            
            ctx.drawImage(img, 0, 0, size, size);
            URL.revokeObjectURL(blobUrl);
            
            const a = document.createElement("a");
            a.download = `custom-qr.${ext}`;
            a.href = canvas.toDataURL(ext === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            console.error("Failed to render QR Code image for export.");
        };
        img.src = blobUrl;
    }
});
