const fs = require('fs');

// Keep the clean HTML (lines 1 to 806)
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const cleanHtml = lines.slice(0, 806).join('\n');

// Write the correct complete JS block
const js = `    <script>
        // ── State ──────────────────────────────────────────────────────────────
        let state = {
            text: "Bubbling",
            color: "#ef4444",
            thickness: 8,
            gap: 4,
            sharp: false,
            font: 'Lexend',
            weight: 700,
            lineHeight: 1.1,
            showText: true,
            contourRelax: 0.15,
            zoom: 1.0,
            x: 0,
            y: 0,
            eraseMode: false,
            brushSize: 30,
            strokes: []
        };

        const fontConfig = {
            'Inter': [
                { label: 'Regular', value: 400 },
                { label: 'Medium', value: 500 },
                { label: 'Bold', value: 700 },
                { label: 'Extra Bold', value: 800 },
                { label: 'Black', value: 900 }
            ],
            'Lexend': [
                { label: 'Light', value: 300 },
                { label: 'Regular', value: 400 },
                { label: 'Medium', value: 500 },
                { label: 'Semi Bold', value: 600 },
                { label: 'Bold', value: 700 },
                { label: 'Extra Bold', value: 800 },
                { label: 'Black', value: 900 }
            ]
        };

        // ── DOM Elements ───────────────────────────────────────────────────────
        const displayBg = document.getElementById('word-display-bg');
        const displayFg = document.getElementById('word-display-fg');
        const transformContainer = document.getElementById('transform-container');
        const compositeGroup = document.getElementById('composite-group');
        const eraserCanvas = document.getElementById('eraser-canvas');
        const eraserCtx = eraserCanvas.getContext('2d');
        const textInput = document.getElementById('text-input');
        const thicknessRange = document.getElementById('thickness-range');
        const thicknessVal = document.getElementById('thickness-val');
        const gapRange = document.getElementById('gap-range');
        const gapVal = document.getElementById('gap-val');
        const iconSun = document.getElementById('icon-sun');
        const iconMoon = document.getElementById('icon-moon');
        const html = document.documentElement;
        const transparentBgCheck = document.getElementById('transparent-bg');
        const sharpOutlineCheck = document.getElementById('sharp-outline');
        const labelSmooth = document.getElementById('label-smooth');
        const labelSharp = document.getElementById('label-sharp');
        const fontFamilySelect = document.getElementById('font-family');
        const fontWeightSelect = document.getElementById('font-weight');
        const lineHeightRange = document.getElementById('line-height-range');
        const lineHeightVal = document.getElementById('line-height-val');
        const showTextCheck = document.getElementById('show-text');
        const contourRelaxRange = document.getElementById('contour-relax-range');
        const contourRelaxVal = document.getElementById('contour-relax-val');
        const zoomRange = document.getElementById('zoom-range');
        const zoomVal = document.getElementById('zoom-val');
        const eraseModeCheck = document.getElementById('erase-mode');
        const eraseTools = document.getElementById('erase-tools');
        const brushSizeRange = document.getElementById('brush-size-range');
        const brushSizeVal = document.getElementById('brush-size-val');
        const clearEraserBtn = document.getElementById('clear-eraser-btn');
        const aboutModal = document.getElementById('about-modal');
        const drawer = document.getElementById('controls-drawer');
        const drawerChevron = document.getElementById('drawer-chevron');
        const displayArea = document.getElementById('display-area');

        // ── Drawer logic ───────────────────────────────────────────────────────
        let drawerExpanded = false;
        const drawerTab = document.getElementById('drawer-tab');

        function toggleDrawer() {
            drawerExpanded = !drawerExpanded;
            drawer.classList.toggle('drawer-expanded', drawerExpanded);
            drawerChevron.style.transform = drawerExpanded ? 'rotate(180deg)' : '';
            if (drawerTab) drawerTab.classList.toggle('open', drawerExpanded);
        }

        function closeDrawer() {
            drawerExpanded = false;
            drawer.classList.remove('drawer-expanded');
            drawerChevron.style.transform = '';
            if (drawerTab) drawerTab.classList.remove('open');
        }

        // ── Initialise selected color ──────────────────────────────────────────
        document.querySelector('.color-btn[title="Red"]').classList.add('ring-indigo-500', 'ring-offset-2');
        document.querySelector('.color-btn[title="Red"]').classList.remove('ring-transparent');

        // ── Theme ──────────────────────────────────────────────────────────────
        function toggleTheme() {
            html.classList.toggle('dark');
            updateThemeIcon();
            updateDisplay();
            // Redraw immediately — bgColor is derived from the dark class, not computed style,
            // so it's always correct with zero delay.
            redrawEraserCanvas();
        }

        function updateThemeIcon() {
            const dark = html.classList.contains('dark');
            iconSun.classList.toggle('hidden', !dark);
            iconMoon.classList.toggle('hidden', dark);
        }

        // ── About modal ────────────────────────────────────────────────────────
        function toggleAbout() {
            const hidden = aboutModal.classList.contains('hidden');
            if (hidden) {
                aboutModal.classList.remove('hidden');
                aboutModal.classList.add('flex');
            } else {
                aboutModal.classList.add('hidden');
                aboutModal.classList.remove('flex');
            }
        }

        // ── Font weights ───────────────────────────────────────────────────────
        function updateWeightOptions() {
            const weights = fontConfig[state.font];
            fontWeightSelect.innerHTML = '';
            let matchFound = false;
            weights.forEach(w => {
                const option = document.createElement('option');
                option.value = w.value;
                option.textContent = w.label;
                if (w.value === state.weight) { option.selected = true; matchFound = true; }
                fontWeightSelect.appendChild(option);
            });
            if (!matchFound) {
                const def = weights.find(w => w.value === 900) || weights.find(w => w.value === 700) || weights[0];
                state.weight = def.value;
                fontWeightSelect.value = state.weight;
            }
        }

        // ── Filter helpers ─────────────────────────────────────────────────────
        function getAdaptiveCloseRadius(weight, outlineRadius, fontSize) {
            const fsv = parseFloat(fontSize) || 100;
            return Math.max(fsv * state.contourRelax, 0);
        }

        const REFERENCE_FONT_SIZE = 96;

        function scaleRadius(sliderValue, currentFontSize) {
            const scale = (parseFloat(currentFontSize) || REFERENCE_FONT_SIZE) / REFERENCE_FONT_SIZE;
            return Math.max(sliderValue * scale, 0.5);
        }

        function buildExpandedShape(radius, contourRadius, sharp, prefix) {
            if (contourRadius > 0) {
                const cBlur = Math.max(contourRadius / 4, 0.6);
                if (sharp) {
                    return {
                        xml: \`<feMorphology operator="dilate" radius="\${contourRadius}" in="SourceAlpha" result="\${prefix}_cr1" /><feMorphology operator="erode" radius="\${contourRadius}" in="\${prefix}_cr1" result="\${prefix}_cr2" /><feMorphology operator="dilate" radius="\${radius}" in="\${prefix}_cr2" result="\${prefix}_exp" />\`,
                        result: \`\${prefix}_exp\`
                    };
                } else {
                    return {
                        xml: \`<feMorphology operator="dilate" radius="\${contourRadius}" in="SourceAlpha" result="\${prefix}_cr1" /><feMorphology operator="erode" radius="\${contourRadius}" in="\${prefix}_cr1" result="\${prefix}_cr2" /><feGaussianBlur stdDeviation="\${cBlur}" in="\${prefix}_cr2" result="\${prefix}_crBlur" /><feComponentTransfer in="\${prefix}_crBlur" result="\${prefix}_crRelaxed"><feFuncA type="linear" slope="30" intercept="-14" /></feComponentTransfer><feMorphology operator="dilate" radius="\${radius}" in="\${prefix}_crRelaxed" result="\${prefix}_exp" />\`,
                        result: \`\${prefix}_exp\`
                    };
                }
            } else {
                return {
                    xml: \`<feMorphology operator="dilate" radius="\${radius}" in="SourceAlpha" result="\${prefix}_exp" />\`,
                    result: \`\${prefix}_exp\`
                };
            }
        }

        function getFilterContent(radius, color, _unused = false, sharp = false, fontSize = '100px', prefix = 'gf') {
            const contourRadius = getAdaptiveCloseRadius(state.weight, radius, fontSize);
            const aaBlur = Math.max(radius * 0.12, 0.4);
            const AA_SLOPE = 8;
            const AA_OFFSET = -3.5;
            const { xml: shapeXml, result: expandedNode } = buildExpandedShape(radius, contourRadius, sharp, prefix);
            if (sharp) {
                return \`\${shapeXml}<feFlood flood-color="\${color}" result="\${prefix}_col" /><feComposite operator="in" in="\${prefix}_col" in2="\${expandedNode}" />\`;
            } else {
                return \`\${shapeXml}<feGaussianBlur stdDeviation="\${aaBlur}" in="\${expandedNode}" result="\${prefix}_aa" /><feComponentTransfer in="\${prefix}_aa" result="\${prefix}_shaped"><feFuncA type="linear" slope="\${AA_SLOPE}" intercept="\${AA_OFFSET}" /></feComponentTransfer><feFlood flood-color="\${color}" result="\${prefix}_col" /><feComposite operator="in" in="\${prefix}_col" in2="\${prefix}_shaped" />\`;
            }
        }

        function getRingFilterContent(gapRadius, totalRadius, outlineColor, sharp = false, fontSize = '100px') {
            const closeRadius = getAdaptiveCloseRadius(state.weight, totalRadius, fontSize);
            const AA_SLOPE = 8;
            const AA_OFFSET = -3.5;
            const { xml: outerXml, result: outerNode } = buildExpandedShape(totalRadius, closeRadius, sharp, 'rf_o');
            const { xml: innerXml, result: innerNode } = buildExpandedShape(gapRadius, closeRadius, sharp, 'rf_i');
            if (sharp) {
                return \`\${outerXml}\${innerXml}<feComposite operator="out" in="\${outerNode}" in2="\${innerNode}" result="ring" /><feFlood flood-color="\${outlineColor}" result="rf_col" /><feComposite operator="in" in="rf_col" in2="ring" />\`;
            } else {
                const outerAA = Math.max(totalRadius * 0.12, 0.4);
                const innerAA = Math.max(gapRadius * 0.12, 0.4);
                return \`\${outerXml}\${innerXml}<feGaussianBlur stdDeviation="\${outerAA}" in="\${outerNode}" result="rf_o_aa" /><feComponentTransfer in="rf_o_aa" result="rf_o_shaped"><feFuncA type="linear" slope="\${AA_SLOPE}" intercept="\${AA_OFFSET}" /></feComponentTransfer><feGaussianBlur stdDeviation="\${innerAA}" in="\${innerNode}" result="rf_i_aa" /><feComponentTransfer in="rf_i_aa" result="rf_i_shaped"><feFuncA type="linear" slope="\${AA_SLOPE}" intercept="\${AA_OFFSET}" /></feComponentTransfer><feComposite operator="out" in="rf_o_shaped" in2="rf_i_shaped" result="ring" /><feFlood flood-color="\${outlineColor}" result="rf_col" /><feComposite operator="in" in="rf_col" in2="ring" />\`;
            }
        }

        // ── setBubbleColor ────────────────────────────────────────────────────
        function setBubbleColor(color, btn) {
            state.color = color;
            document.querySelectorAll('.color-btn').forEach(b => {
                b.classList.remove('ring-indigo-500', 'ring-offset-2');
                b.classList.add('ring-transparent');
            });
            if (btn) {
                btn.classList.add('ring-indigo-500', 'ring-offset-2');
                btn.classList.remove('ring-transparent');
            }
            updateDisplay();
        }

        // ── Color utility ─────────────────────────────────────────────────────
        function hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
            hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
            var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? \`rgb(\${parseInt(result[1], 16)}, \${parseInt(result[2], 16)}, \${parseInt(result[3], 16)})\` : hex;
        }

        // ── Font embedding ────────────────────────────────────────────────────
        const fontCache = new Map();

        async function getEmbeddedFont(fontFamily, fontWeight) {
            const cacheKey = \`\${fontFamily}-\${fontWeight}\`;
            if (fontCache.has(cacheKey)) return fontCache.get(cacheKey);
            try {
                const googleUrl = \`https://fonts.googleapis.com/css2?family=\${fontFamily.replace(' ', '+')}:wght@\${fontWeight}&display=swap\`;
                const cssResp = await fetch(googleUrl);
                const css = await cssResp.text();
                const urlMatch = css.match(/url\\(([^)]+)\\)/);
                if (!urlMatch) return null;
                const fontUrl = urlMatch[1].replace(/['"]/g, '');
                const fontResp = await fetch(fontUrl);
                const fontBlob = await fontResp.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const dataUrl = reader.result;
                        fontCache.set(cacheKey, dataUrl);
                        resolve(dataUrl);
                    };
                    reader.readAsDataURL(fontBlob);
                });
            } catch (e) {
                console.warn('Font embed failed:', e);
                return null;
            }
        }

        // ── Build SVG filter string ────────────────────────────────────────────
        function buildFilterStr(fontSize) {
            const fs = fontSize || (displayBg.style.fontSize);
            const thick = scaleRadius(state.thickness, fs);
            const gap = scaleRadius(state.gap, fs);
            const colorRgb = hexToRgb(state.color);
            const outlineContent = getRingFilterContent(gap, gap + thick, colorRgb, state.sharp, fs);
            const gapContent = getFilterContent(gap, '#000000', false, state.sharp, fs, 'gfg');
            const whiteContent = getFilterContent(gap, '#ffffff', false, state.sharp, fs, 'gfw');

            let outlineBlock, gapBlock;
            if (state.sharp) {
                outlineBlock = \`<filter id="outline" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">\${outlineContent}<feComposite operator="over" in="SourceGraphic" /></filter>\`;
                gapBlock = \`<filter id="gap" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">\${gapContent}<feComposite operator="over" in="SourceGraphic" /></filter>\`;
            } else {
                outlineBlock = \`<filter id="outline" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">\${outlineContent}<feComposite operator="over" in="SourceGraphic" /></filter>\`;
                gapBlock = \`<filter id="gap" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">\${gapContent}<feComposite operator="over" in="SourceGraphic" /></filter>\`;
            }

            return \`<svg xmlns="http://www.w3.org/2000/svg"><filter id="f" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">\${outlineContent}<feComposite operator="over" in="SourceGraphic" /></filter></svg>\`;
        }

        // ── Update display ────────────────────────────────────────────────────
        function updateDisplay() {
            const text = state.text || '';
            displayBg.textContent = text;
            displayBg.setAttribute('data-text', text);
            displayFg.textContent = text;

            const fs = displayBg.style.fontSize || '100px';
            const thick = scaleRadius(state.thickness, fs);
            const gap = scaleRadius(state.gap, fs);

            const colorRgb = hexToRgb(state.color);
            const outlineFilter = getRingFilterContent(gap, gap + thick, colorRgb, state.sharp, fs);
            const gapFilter = getFilterContent(gap, '#000000', false, state.sharp, fs, 'gfg');
            const whiteFilter = getFilterContent(gap, '#ffffff', false, state.sharp, fs, 'gfw');

            const svgFilters = \`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
                <defs>
                    <filter id="f-outline" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
                        \${outlineFilter}
                        <feComposite operator="over" in="SourceGraphic" />
                    </filter>
                    <filter id="f-gap" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
                        \${gapFilter}
                        <feComposite operator="over" in="SourceGraphic" />
                    </filter>
                    <filter id="f-white" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
                        \${whiteFilter}
                        <feComposite operator="over" in="SourceGraphic" />
                    </filter>
                </defs>
            </svg>\`;

            // Combined filter: white gap layer + colored outline layer
            const combinedFilter = \`url(#f-outline)\`;
            const gapCombined = \`url(#f-gap)\`;

            const existingSvg = document.getElementById('live-filters');
            if (existingSvg) existingSvg.remove();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgFilters, 'image/svg+xml');
            const svgEl = svgDoc.documentElement;
            svgEl.id = 'live-filters';
            svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
            document.body.appendChild(svgEl);

            const lineH = state.lineHeight;
            displayBg.style.lineHeight = lineH;
            displayFg.style.lineHeight = lineH;

            // Layered filter composition
            const contourFilterCombined = \`url(#f-white) url(#f-outline)\`;
            displayBg.style.setProperty('--contour-filter-combined', contourFilterCombined);
            displayBg.style.fontFamily = \`'\${state.font}', sans-serif\`;
            displayBg.style.fontWeight = state.weight;

            displayFg.style.fontFamily = \`'\${state.font}', sans-serif\`;
            displayFg.style.fontWeight = state.weight;
            displayFg.style.opacity = state.showText ? '1' : '0';

            compositeGroup.style.fontFamily = \`'\${state.font}', sans-serif\`;
            compositeGroup.style.fontWeight = state.weight;

            transformContainer.style.transform = \`translate(\${state.x}px, \${state.y}px) scale(\${state.zoom})\`;
        }

        // ── Export PNG ────────────────────────────────────────────────────────
        async function exportPNG() {
            const btn = document.getElementById('export-btn-label');
            if (btn) btn.textContent = 'Exporting…';
            try {
                const text = state.text || 'Word';
                const fontSize = 96;
                const isTransparent = transparentBgCheck.checked;
                const bgColor = html.classList.contains('dark') ? '#000000' : '#ffffff';

                // Build a standalone SVG for export
                const thick = state.thickness;
                const gap = state.gap;
                const colorRgb = hexToRgb(state.color);
                const fs = fontSize + 'px';
                const outlineFilter = getRingFilterContent(gap, gap + thick, colorRgb, state.sharp, fs);
                const gapFilter = getFilterContent(gap, '#000000', false, state.sharp, fs, 'gfg');
                const whiteFilter = getFilterContent(gap, '#ffffff', false, state.sharp, fs, 'gfw');

                const fontDataUrl = await getEmbeddedFont(state.font, state.weight);
                const fontFaceCSS = fontDataUrl
                    ? \`@font-face { font-family: '\${state.font}'; src: url('\${fontDataUrl}'); font-weight: \${state.weight}; }\`
                    : '';

                const canvas = document.createElement('canvas');
                const padding = (gap + thick) * 4 + 40;
                const lineCount = text.split('\\n').length;
                canvas.width = Math.max(fontSize * text.split('\\n').reduce((a, l) => Math.max(a, l.length), 0) * 0.65 + padding * 2, 200);
                canvas.height = fontSize * lineCount * state.lineHeight + padding * 2;
                const ctx = canvas.getContext('2d');

                if (!isTransparent) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw svg to canvas via Image
                const svgStr = \`<svg xmlns="http://www.w3.org/2000/svg" width="\${canvas.width}" height="\${canvas.height}">
                    <defs>
                        <style>\${fontFaceCSS}</style>
                        <filter id="f-outline" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
                            \${outlineFilter}<feComposite operator="over" in="SourceGraphic" />
                        </filter>
                        <filter id="f-white" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
                            \${whiteFilter}<feComposite operator="over" in="SourceGraphic" />
                        </filter>
                    </defs>
                    \${!isTransparent ? \`<rect width="100%" height="100%" fill="\${bgColor}"/>\` : ''}
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                        font-family="'\${state.font}', sans-serif" font-weight="\${state.weight}"
                        font-size="\${fontSize}" style="filter: url(#f-white) url(#f-outline);"
                        fill="\${html.classList.contains('dark') ? 'white' : 'black'}">\${text}</text>
                </svg>\`;

                const blob = new Blob([svgStr], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    const a = document.createElement('a');
                    a.download = \`word-bubbling-\${text.replace(/\\s+/g, '-').toLowerCase()}.png\`;
                    a.href = canvas.toDataURL('image/png');
                    a.click();
                    if (btn) btn.textContent = '';
                };
                img.onerror = () => {
                    alert('Export failed. Please try again.');
                    if (btn) btn.textContent = '';
                };
                img.src = url;
            } catch (e) {
                console.error('Export error:', e);
                alert('Export failed: ' + e.message);
                if (btn) btn.textContent = '';
            }
        }

        // ── Fit font size ──────────────────────────────────────────────────────
        function fitFontSize() {
            if (!displayArea || !displayBg) return;
            const style = window.getComputedStyle(displayArea);
            const padH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const padV = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            const areaW = (displayArea.clientWidth - padH) * 0.90;
            const areaH = (displayArea.clientHeight - padV) * 0.90;
            if (areaW <= 0 || areaH <= 0) return;
            let lo = 12, hi = 2000, best = lo, safety = 0;
            while (lo <= hi && safety++ < 100) {
                const mid = Math.floor((lo + hi) / 2);
                displayBg.style.fontSize = mid + 'px';
                if (displayBg.scrollWidth <= Math.ceil(areaW) && displayBg.scrollHeight <= Math.ceil(areaH)) {
                    best = mid; lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
            displayBg.style.fontSize = best + 'px';
            displayFg.style.fontSize = best + 'px';
            compositeGroup.style.fontSize = best + 'px';
        }

        const resizeObserver = new ResizeObserver(() => { fitFontSize(); updateDisplay(); });
        resizeObserver.observe(displayArea);

        // ── Zoom (Scroll Wheel) ────────────────────────────────────────────────
        displayArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            const newZoom = Math.min(Math.max(state.zoom + delta, 0.2), 2.0);
            if (Math.abs(newZoom - state.zoom) > 0.001) {
                state.zoom = newZoom;
                zoomRange.value = state.zoom;
                zoomVal.textContent = Math.round(state.zoom * 100) + '%';
                fitFontSize();
                updateDisplay();
            }
        }, { passive: false });

        // ── Eraser canvas ──────────────────────────────────────────────────────
        function getEraserCoords(clientX, clientY) {
            const rect = eraserCanvas.getBoundingClientRect();
            const scaleX = eraserCanvas.width / rect.width;
            const scaleY = eraserCanvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX - 2000,
                y: (clientY - rect.top) * scaleY - 2000
            };
        }

        function startDrag(x, y) {
            isDragging = true;
            startX = x; startY = y;
            initialX = state.x; initialY = state.y;
            displayArea.style.cursor = 'grabbing';
        }

        function handlePointerStart(x, y) {
            if (state.eraseMode) {
                isPainting = true;
                currentStroke = { size: state.brushSize, points: [getEraserCoords(x, y)] };
                state.strokes.push(currentStroke);
                redrawEraserCanvas();
            } else {
                startDrag(x, y);
            }
        }

        function handlePointerMove(x, y) {
            if (isPainting && currentStroke) {
                currentStroke.points.push(getEraserCoords(x, y));
                redrawEraserCanvas();
            } else if (isDragging) {
                const dx = x - startX;
                const dy = y - startY;
                state.x = initialX + dx;
                state.y = initialY + dy;
                transformContainer.style.transform = \`translate(\${state.x}px, \${state.y}px) scale(\${state.zoom})\`;
            }
        }

        function handlePointerEnd() {
            if (isPainting) isPainting = false;
            if (isDragging) {
                isDragging = false;
                displayArea.style.cursor = state.eraseMode ? 'crosshair' : '';
            }
        }

        let isDragging = false, isPainting = false;
        let startX = 0, startY = 0, initialX = 0, initialY = 0;
        let currentStroke = null;
        let initialPinchDist = null, initialZoom = 1;

        displayArea.addEventListener('mousedown', (e) => {
            if (e.target.closest('#controls-drawer')) return;
            if (e.button === 1) {
                e.preventDefault();
                startDrag(e.clientX, e.clientY);
            } else if (e.button === 0) {
                handlePointerStart(e.clientX, e.clientY);
            }
        });

        displayArea.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
        displayArea.addEventListener('mouseup', (e) => { if (e.button === 1) handlePointerEnd(); });

        window.addEventListener('mousemove', (e) => {
            handlePointerMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', handlePointerEnd);

        displayArea.addEventListener('touchstart', (e) => {
            if (e.target.closest('#controls-drawer')) return;
            if (e.touches.length === 1) {
                handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                isDragging = false; isPainting = false;
                e.preventDefault();
                initialPinchDist = getDist(e.touches);
                initialZoom = state.zoom;
            }
        }, { passive: false });

        displayArea.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2 && initialPinchDist) {
                e.preventDefault();
                const dist = getDist(e.touches);
                const newZoom = Math.min(Math.max(initialZoom * (dist / initialPinchDist), 0.2), 2.0);
                state.zoom = newZoom;
                zoomRange.value = state.zoom;
                zoomVal.textContent = Math.round(state.zoom * 100) + '%';
                fitFontSize();
                updateDisplay();
            }
        }, { passive: false });

        displayArea.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) handlePointerEnd();
        });

        function getDist(touches) {
            return Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY
            );
        }

        // ── Redraw eraser canvas ───────────────────────────────────────────────
        function redrawEraserCanvas() {
            eraserCtx.clearRect(0, 0, eraserCanvas.width, eraserCanvas.height);
            if (state.strokes.length === 0) return;
            eraserCtx.lineCap = 'round';
            eraserCtx.lineJoin = 'round';
            // Derive bg colour directly from the dark class — always accurate,
            // never depends on CSS transitions, so redraws are always instant.
            const bgColor = document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff';
            state.strokes.forEach(stroke => {
                if (stroke.points.length === 0) return;
                eraserCtx.lineWidth = stroke.size;
                eraserCtx.strokeStyle = bgColor;
                eraserCtx.beginPath();
                eraserCtx.moveTo(2000 + stroke.points[0].x, 2000 + stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    eraserCtx.lineTo(2000 + stroke.points[i].x, 2000 + stroke.points[i].y);
                }
                eraserCtx.stroke();
            });
        }

        // ── Event listeners ────────────────────────────────────────────────────
        textInput.addEventListener('input', () => {
            state.text = textInput.value;
            fitFontSize();
            updateDisplay();
        });

        thicknessRange.addEventListener('input', () => {
            state.thickness = +thicknessRange.value;
            thicknessVal.textContent = state.thickness + 'px';
            updateDisplay();
        });

        gapRange.addEventListener('input', () => {
            state.gap = +gapRange.value;
            gapVal.textContent = state.gap + 'px';
            updateDisplay();
        });

        sharpOutlineCheck.addEventListener('change', () => {
            state.sharp = sharpOutlineCheck.checked;
            labelSmooth.classList.toggle('text-indigo-500', !state.sharp);
            labelSmooth.classList.toggle('text-slate-400', state.sharp);
            labelSharp.classList.toggle('text-indigo-500', state.sharp);
            labelSharp.classList.toggle('text-slate-400', !state.sharp);
            updateDisplay();
        });

        fontFamilySelect.addEventListener('change', () => {
            state.font = fontFamilySelect.value;
            updateWeightOptions();
            fitFontSize();
            updateDisplay();
        });

        fontWeightSelect.addEventListener('change', () => {
            state.weight = +fontWeightSelect.value;
            fitFontSize();
            updateDisplay();
        });

        lineHeightRange.addEventListener('input', () => {
            state.lineHeight = +lineHeightRange.value;
            lineHeightVal.textContent = state.lineHeight.toFixed(1);
            fitFontSize();
            updateDisplay();
        });

        showTextCheck.addEventListener('change', () => {
            state.showText = showTextCheck.checked;
            updateDisplay();
        });

        contourRelaxRange.addEventListener('input', () => {
            state.contourRelax = +contourRelaxRange.value;
            contourRelaxVal.textContent = state.contourRelax.toFixed(2);
            updateDisplay();
        });

        zoomRange.addEventListener('input', () => {
            state.zoom = +zoomRange.value;
            zoomVal.textContent = Math.round(state.zoom * 100) + '%';
            updateDisplay();
        });

        eraseModeCheck.addEventListener('change', () => {
            state.eraseMode = eraseModeCheck.checked;
            eraseTools.classList.toggle('hidden', !state.eraseMode);
            displayArea.style.cursor = state.eraseMode ? 'crosshair' : '';
        });

        brushSizeRange.addEventListener('input', () => {
            state.brushSize = +brushSizeRange.value;
            brushSizeVal.textContent = state.brushSize + 'px';
        });

        clearEraserBtn.addEventListener('click', () => {
            state.strokes = [];
            redrawEraserCanvas();
        });

        // ── Initialise ─────────────────────────────────────────────────────────
        updateWeightOptions();
        updateThemeIcon();
        fitFontSize();
        updateDisplay();

        // Splash screen fade
        window.addEventListener('load', () => {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.remove(), 700);
                }, 800);
            }
        });

        // ── PWA Service Worker ─────────────────────────────────────────────────
        let newWorker;
        function showUpdateBanner() { document.getElementById('update-banner').classList.add('show'); }
        function updateApp() { if (newWorker) newWorker.postMessage({ action: 'skipWaiting' }); }

        if ('serviceWorker' in navigator) {
            if (!['file:', 'data:'].includes(window.location.protocol)) {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => {
                        reg.addEventListener('updatefound', () => {
                            newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdateBanner();
                                }
                            });
                        });
                    })
                    .catch(err => console.log('SW failed:', err));
                navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
            }
        }
    </script>
</body>
</html>`;

const fullFile = cleanHtml + '\n' + js;
fs.writeFileSync('index.html', fullFile);
console.log('Done. Total lines:', fullFile.split('\n').length);
console.log('File size:', fullFile.length, 'bytes');
