const storageKey = 'lantan-moon-heart-plan-v1';

function readPlan(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

function setupPlan(): void {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-plan-id]'));
  const count = document.querySelector<HTMLElement>('#planCount');
  const clearButton = document.querySelector<HTMLButtonElement>('#clearPlan');
  let selected = readPlan();

  const render = (): void => {
    inputs.forEach((input) => {
      const id = input.dataset.planId;
      input.checked = Boolean(id && selected.has(id));
    });
    if (count) count.textContent = String(selected.size);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...selected]));
    } catch {
      // 某些隱私模式可能停用儲存；清單仍可在目前頁面使用。
    }
  };

  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.dataset.planId;
      if (!id) return;
      if (input.checked) selected.add(id);
      else selected.delete(id);
      render();
    });
  });

  clearButton?.addEventListener('click', () => {
    selected = new Set<string>();
    render();
  });

  render();
}

function setupGallery(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
  const image = document.querySelector<HTMLImageElement>('#lightboxImage');
  const title = document.querySelector<HTMLElement>('#lightboxTitle');
  const close = document.querySelector<HTMLButtonElement>('#lightboxClose');
  if (!dialog || !image || !title) return;

  document.querySelectorAll<HTMLButtonElement>('[data-gallery-src]').forEach((button) => {
    button.addEventListener('click', () => {
      image.src = button.dataset.gallerySrc ?? '';
      image.alt = button.dataset.galleryAlt ?? '';
      title.textContent = button.dataset.galleryTitle ?? '';
      dialog.showModal();
    });
  });

  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

type CardSize = 'square' | 'postcard' | 'story';
type CardStyle = 'moon' | 'silver' | 'gold';

const canvasSizes: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1200, height: 1200 },
  postcard: { width: 1200, height: 1600 },
  story: { width: 1080, height: 1920 },
};

const styleThemes: Record<CardStyle, {
  top: string;
  bottom: string;
  accent: string;
  text: string;
  subtext: string;
}> = {
  moon: {
    top: 'rgba(4, 19, 16, 0.12)',
    bottom: 'rgba(4, 19, 16, 0.94)',
    accent: '#d8b77f',
    text: '#f7f1e8',
    subtext: '#dce8e2',
  },
  silver: {
    top: 'rgba(31, 40, 43, 0.18)',
    bottom: 'rgba(12, 23, 27, 0.94)',
    accent: '#dfe8e9',
    text: '#ffffff',
    subtext: '#d7e0e2',
  },
  gold: {
    top: 'rgba(60, 28, 8, 0.08)',
    bottom: 'rgba(42, 20, 8, 0.92)',
    accent: '#f4c982',
    text: '#fff7e9',
    subtext: '#f1dfc5',
  },
};

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const characters = Array.from(text.trim());
  const lines: string[] = [];
  let line = '';
  characters.forEach((character) => {
    const testLine = `${line}${character}`;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function setupCardMaker(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#souvenirCanvas');
  const fileInput = document.querySelector<HTMLInputElement>('#photoInput');
  const selfieInput = document.querySelector<HTMLInputElement>('#selfieInput');
  const sizeInput = document.querySelector<HTMLSelectElement>('#cardSize');
  const styleInput = document.querySelector<HTMLSelectElement>('#cardStyle');
  const placeInput = document.querySelector<HTMLInputElement>('#cardPlace');
  const dateInput = document.querySelector<HTMLInputElement>('#cardDate');
  const noteInput = document.querySelector<HTMLInputElement>('#cardNote');
  const downloadButton = document.querySelector<HTMLButtonElement>('#downloadCard');
  const status = document.querySelector<HTMLElement>('#cardStatus');
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx || !fileInput || !selfieInput || !sizeInput || !styleInput || !placeInput || !dateInput || !noteInput || !downloadButton) return;

  dateInput.value = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  let activeImage = new Image();
  activeImage.decoding = 'async';

  const render = (): void => {
    if (!activeImage.complete || !activeImage.naturalWidth) return;
    const size = (sizeInput.value in canvasSizes ? sizeInput.value : 'square') as CardSize;
    const style = (styleInput.value in styleThemes ? styleInput.value : 'moon') as CardStyle;
    const dimensions = canvasSizes[size];
    const theme = styleThemes[style];
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCover(ctx, activeImage, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(0.52, 'rgba(0, 0, 0, 0.05)');
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = Math.round(canvas.width * 0.075);
    const bottom = Math.round(canvas.height * 0.075);
    const ruleY = canvas.height - bottom - Math.round(canvas.height * 0.21);

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(3, canvas.width * 0.003);
    ctx.beginPath();
    ctx.arc(canvas.width - margin * 1.25, margin * 1.25, margin * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width - margin * 1.25, margin * 1.25, margin * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${Math.round(canvas.width * 0.022)}px system-ui, sans-serif`;
    ctx.fillText('LANTAN · CHIAYI', margin, ruleY - canvas.height * 0.025);

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(2, canvas.width * 0.0015);
    ctx.beginPath();
    ctx.moveTo(margin, ruleY);
    ctx.lineTo(canvas.width - margin, ruleY);
    ctx.stroke();

    const place = placeInput.value.trim() || '蘭潭月影潭心';
    ctx.fillStyle = theme.text;
    ctx.font = `600 ${Math.round(canvas.width * (size === 'story' ? 0.09 : 0.078))}px "Noto Serif TC", serif`;
    const placeLines = wrapText(ctx, place, canvas.width - margin * 2);
    const lineHeight = canvas.width * 0.1;
    placeLines.forEach((line, index) => {
      ctx.fillText(line, margin, ruleY + lineHeight * (index + 0.9));
    });

    const metaY = canvas.height - bottom;
    ctx.fillStyle = theme.subtext;
    ctx.font = `500 ${Math.round(canvas.width * 0.026)}px system-ui, sans-serif`;
    ctx.fillText(dateInput.value.trim(), margin, metaY);
    ctx.textAlign = 'right';
    const note = noteInput.value.trim();
    ctx.fillText(note.slice(0, 40), canvas.width - margin, metaY);
    ctx.textAlign = 'left';
  };

  activeImage.onload = render;
  activeImage.onerror = () => {
    if (status) status.textContent = '預設照片載入失敗，請改用自己的照片。';
  };
  activeImage.src = '/images/moonheart-main.webp';

  const loadLocalPhoto = (input: HTMLInputElement): void => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (status) status.textContent = '請選擇圖片檔案。';
      input.value = '';
      return;
    }
    const objectURL = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.decoding = 'async';
    nextImage.onload = () => {
      URL.revokeObjectURL(objectURL);
      activeImage = nextImage;
      render();
      if (status) status.textContent = '照片已在本機載入，沒有上傳。';
      input.value = '';
    };
    nextImage.onerror = () => {
      URL.revokeObjectURL(objectURL);
      if (status) status.textContent = '無法讀取這張照片，請換一個檔案。';
      input.value = '';
    };
    nextImage.src = objectURL;
  };

  fileInput.addEventListener('change', () => loadLocalPhoto(fileInput));
  selfieInput.addEventListener('change', () => loadLocalPhoto(selfieInput));

  [sizeInput, styleInput, placeInput, dateInput, noteInput].forEach((input) => {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  });

  downloadButton.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
      if (!blob) {
        if (status) status.textContent = '產生圖片失敗，請再試一次。';
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = '蘭潭月影潭心-紀念卡.png';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (status) status.textContent = '紀念卡已產生並下載。';
    }, 'image/png');
  });
}

setupPlan();
setupGallery();
setupCardMaker();
