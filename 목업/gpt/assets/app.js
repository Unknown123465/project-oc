(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const storageKey = "project-oc-theme";

  function preferredTheme() {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    doc.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.textContent = theme === "dark" ? "밝게 보기" : "어둡게 보기";
      button.setAttribute("aria-label", theme === "dark" ? "밝은 화면으로 전환" : "어두운 화면으로 전환");
    });
  }

  applyTheme(preferredTheme());

  doc.addEventListener("click", (event) => {
    const themeButton = event.target.closest("[data-theme-toggle]");
    if (themeButton) {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      applyTheme(next);
      return;
    }

    const navButton = event.target.closest("[data-nav-toggle]");
    if (navButton) {
      const nav = doc.querySelector("[data-main-nav]");
      const open = nav && !nav.classList.contains("is-open");
      if (nav) nav.classList.toggle("is-open", open);
      navButton.setAttribute("aria-expanded", String(open));
      return;
    }

    const modalOpener = event.target.closest("[data-open-modal]");
    if (modalOpener) {
      openModal(modalOpener.dataset.openModal);
      const modalName = modalOpener.dataset.modalName;
      if (modalName) {
        const label = doc.querySelector("[data-modal-character]");
        if (label) label.textContent = modalName;
      }
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      if (closeButton.dataset.toast) showToast(closeButton.dataset.toast);
      closeModals();
      return;
    }

    const backdrop = event.target.closest(".dialog-backdrop");
    if (backdrop && event.target === backdrop) {
      closeModals();
      return;
    }

    const toastButton = event.target.closest("[data-toast]");
    if (toastButton) {
      event.preventDefault();
      showToast(toastButton.dataset.toast || "처리되었습니다.");
      return;
    }

    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      copyText(copyButton.dataset.copy || "https://projectoc.example/profile/tiara", copyButton);
      return;
    }

    const passwordButton = event.target.closest("[data-password-toggle]");
    if (passwordButton) {
      const input = doc.getElementById(passwordButton.dataset.passwordToggle);
      if (input) {
        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        passwordButton.textContent = reveal ? "숨기기" : "보기";
        passwordButton.setAttribute("aria-pressed", String(reveal));
      }
      return;
    }

    const likeButton = event.target.closest("[data-like]");
    if (likeButton) {
      const active = likeButton.getAttribute("aria-pressed") !== "true";
      likeButton.setAttribute("aria-pressed", String(active));
      const count = likeButton.querySelector("[data-like-count]");
      if (count) count.textContent = String(Number(count.textContent || 0) + (active ? 1 : -1));
      likeButton.classList.toggle("btn-primary", active);
      showToast(active ? "좋아요를 남겼습니다." : "좋아요를 취소했습니다.");
      return;
    }

    const tabButton = event.target.closest("[data-creator-tab]");
    if (tabButton) {
      setCreatorTab(tabButton.dataset.creatorTab);
      return;
    }

    const retryButton = event.target.closest("[data-retry]");
    if (retryButton) {
      window.location.reload();
      return;
    }

    const dangerButton = event.target.closest("[data-confirm-message]");
    if (dangerButton) {
      const confirmed = window.confirm(dangerButton.dataset.confirmMessage);
      if (confirmed) showToast(dangerButton.dataset.confirmedToast || "처리되었습니다.");
      return;
    }

    const resetButton = event.target.closest("[data-reset-filters]");
    if (resetButton) {
      doc.querySelectorAll("[data-search]").forEach((input) => { input.value = ""; });
      doc.querySelectorAll("[data-filter]").forEach((select) => { select.selectedIndex = 0; });
      filterCards();
    }
  });

  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModals();
  });

  function openModal(id) {
    const modal = doc.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    doc.body.style.overflow = "hidden";
    const first = modal.querySelector("button, input, textarea, select, a[href]");
    if (first) setTimeout(() => first.focus(), 0);
  }

  function closeModals() {
    doc.querySelectorAll(".dialog-backdrop.is-open").forEach((modal) => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });
    doc.body.style.overflow = "";
  }

  function showToast(message) {
    let toast = doc.querySelector("[data-global-toast]");
    if (!toast) {
      toast = doc.createElement("div");
      toast.className = "toast";
      toast.dataset.globalToast = "";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      doc.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      const input = doc.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      doc.body.appendChild(input);
      input.select();
      doc.execCommand("copy");
      input.remove();
    }
    const oldText = button.textContent;
    button.textContent = "복사됨";
    showToast("링크를 복사했습니다.");
    setTimeout(() => { button.textContent = oldText; }, 1400);
  }

  doc.querySelectorAll("form[data-validate]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const error = field.closest(".field")?.querySelector(".field-error");
        const empty = !String(field.value || "").trim();
        field.setAttribute("aria-invalid", String(empty));
        if (error) error.classList.toggle("is-visible", empty);
        if (empty) valid = false;
      });

      const confirmField = form.querySelector("[data-confirm-password]");
      if (confirmField) {
        const source = doc.getElementById(confirmField.dataset.confirmPassword);
        const mismatch = source && confirmField.value !== source.value;
        const error = confirmField.closest(".field")?.querySelector(".field-error");
        confirmField.setAttribute("aria-invalid", String(Boolean(mismatch)));
        if (error && mismatch) {
          error.textContent = "비밀번호가 일치하지 않습니다.";
          error.classList.add("is-visible");
        }
        if (mismatch) valid = false;
      }

      if (valid) showToast(form.dataset.success || "입력 내용을 확인했습니다.");
    });
  });

  doc.querySelectorAll("[data-search], [data-filter]").forEach((control) => {
    control.addEventListener(control.tagName === "SELECT" ? "change" : "input", filterCards);
  });

  function filterCards() {
    const search = (doc.querySelector("[data-search]")?.value || "").trim().toLowerCase();
    const filters = Array.from(doc.querySelectorAll("[data-filter]")).map((select) => select.value);
    let visible = 0;
    doc.querySelectorAll("[data-card]").forEach((card) => {
      const haystack = (card.dataset.searchText || card.textContent || "").toLowerCase();
      const categories = (card.dataset.categories || "").split(",");
      const matchesSearch = !search || haystack.includes(search);
      const matchesFilters = filters.every((value) => !value || value === "전체" || categories.includes(value));
      const show = matchesSearch && matchesFilters;
      card.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });
    const empty = doc.querySelector("[data-filter-empty]");
    if (empty) empty.classList.toggle("is-hidden", visible !== 0);
  }

  function setCreatorTab(tab) {
    const grid = doc.querySelector(".creator-grid");
    if (!grid) return;
    grid.classList.toggle("show-preview", tab === "preview");
    doc.querySelectorAll("[data-creator-tab]").forEach((button) => {
      const active = button.dataset.creatorTab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function limitNonWhitespace(value, maximum) {
    let count = 0;
    let limited = "";
    Array.from(value).forEach((character) => {
      if (/\s/u.test(character)) {
        limited += character;
      } else if (count < maximum) {
        limited += character;
        count += 1;
      }
    });
    return { value: limited, count };
  }

  doc.querySelectorAll("[data-nonspace-max]").forEach((field) => {
    const maximum = Number(field.dataset.nonspaceMax) || 100;
    const counter = field.closest(".field")?.querySelector("[data-nonspace-count]");
    const updateCount = () => {
      const result = limitNonWhitespace(field.value, maximum);
      if (field.value !== result.value) field.value = result.value;
      if (counter) counter.textContent = String(result.count);
    };
    field.addEventListener("input", updateCount);
    updateCount();
  });

  const creatorForm = doc.querySelector("[data-creator-form]");
  if (creatorForm) initCreator(creatorForm);

  function initCreator(form) {
    const output = (name) => doc.querySelector(`[data-preview="${name}"]`);
    const bindings = {
      characterName: { fallback: "캐릭터 이름" },
      slogan: { fallback: "이 캐릭터를 한 문장으로 소개해 주세요." },
      race: { fallback: "미입력" },
      age: { fallback: "미입력" },
      birthday: { fallback: "미입력" },
      height: { fallback: "미입력" },
      mbti: { fallback: "미입력" },
      likes: { fallback: "좋아하는 것을 입력해 주세요." },
      hates: { fallback: "싫어하는 것을 입력해 주세요." },
      personality: { fallback: "성격을 간단히 소개해 주세요." }
    };

    Object.entries(bindings).forEach(([name, options]) => {
      const input = form.elements[name];
      const target = output(name);
      if (!input || !target) return;
      const update = () => { target.textContent = input.value.trim() || options.fallback; };
      input.addEventListener("input", update);
      input.addEventListener("change", update);
      update();
    });

    const tmiInput = form.elements.tmi;
    const tmiTarget = output("tmi");
    if (tmiInput && tmiTarget) {
      const updateTmi = () => {
        const lines = tmiInput.value.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 5);
        tmiTarget.innerHTML = "";
        (lines.length ? lines : ["작은 습관이나 숨은 설정을 적어 주세요."]).forEach((line) => {
          const item = doc.createElement("li");
          item.textContent = line;
          tmiTarget.appendChild(item);
        });
      };
      tmiInput.addEventListener("input", updateTmi);
      updateTmi();
    }

    const color = form.elements.personalColor;
    const sheet = doc.querySelector("[data-profile-sheet]");
    if (color && sheet) {
      const updateColor = () => sheet.style.setProperty("--character-accent", color.value || "#ffc90e");
      color.addEventListener("input", updateColor);
      updateColor();
    }

    const previewImage = doc.querySelector("[data-preview-image]");
    const uploadPreview = doc.querySelector("[data-upload-preview]");
    if (previewImage && uploadPreview) initImageEditor(form, previewImage, uploadPreview);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.elements.characterName;
      if (!name.value.trim()) {
        name.setAttribute("aria-invalid", "true");
        name.focus();
        showToast("캐릭터 이름을 입력해 주세요.");
        return;
      }
      showToast("프로필이 완성되었습니다.");
      setCreatorTab("preview");
    });
  }

  function initImageEditor(form, previewImage, uploadPreview) {
    const modal = doc.getElementById("image-editor-modal");
    if (!modal) return;

    const typeDefinitions = {
      landscape: { label: "가로형", ratio: 8 / 5, width: 1200, height: 750 },
      portrait: { label: "세로형", ratio: 3 / 4, width: 900, height: 1200 },
      square: { label: "정사각형", ratio: 1, width: 1000, height: 1000 }
    };
    const frameLabels = { rectangle: "사각형 프레임", ellipse: "타원 프레임" };
    const setup = modal.querySelector("[data-image-upload-setup]");
    const workspace = modal.querySelector("[data-image-editor-workspace]");
    const fileInput = modal.querySelector("[data-image-file]");
    const pickButton = modal.querySelector("[data-pick-image]");
    const replaceButton = modal.querySelector("[data-replace-image]");
    const applyButton = modal.querySelector("[data-apply-image]");
    const error = modal.querySelector("[data-image-editor-error]");
    const stage = modal.querySelector("[data-editor-stage]");
    const canvasWrap = modal.querySelector("[data-editor-canvas-wrap]");
    const canvas = modal.querySelector("[data-editor-canvas]");
    const selection = modal.querySelector("[data-crop-selection]");
    const typeLabel = modal.querySelector("[data-editor-type-label]");
    const fileName = modal.querySelector("[data-editor-file-name]");
    const outputSize = modal.querySelector("[data-editor-output-size]");
    const appliedType = doc.querySelector("[data-applied-image-type]");
    const appliedFrame = doc.querySelector("[data-applied-frame]");
    const typeValue = form.querySelector("[data-image-type-value]");
    const frameValue = form.querySelector("[data-image-frame-value]");
    const cropValue = form.querySelector("[data-image-crop-value]");
    const uploadZone = uploadPreview.closest(".upload-zone");
    const previewSheet = doc.querySelector("[data-profile-sheet]");
    const previewLayoutLabel = doc.querySelector("[data-preview-layout-label]");
    const shades = Object.fromEntries(Array.from(modal.querySelectorAll("[data-crop-shade]")).map((item) => [item.dataset.cropShade, item]));

    let sourceImage = null;
    let sourceFile = null;
    let imageType = "landscape";
    let crop = { x: 0, y: 0, width: 0, height: 0 };
    let displaySize = { width: 0, height: 0 };
    let dragState = null;

    pickButton.addEventListener("click", () => {
      const checkedType = modal.querySelector('input[name="editorImageType"]:checked');
      if (!checkedType) {
        setEditorError("이미지 유형을 먼저 선택해 주세요.");
        modal.querySelector('input[name="editorImageType"]')?.focus();
        return;
      }
      imageType = checkedType.value;
      setEditorError("");
      fileInput.click();
    });

    modal.querySelectorAll('input[name="editorImageType"]').forEach((input) => {
      input.addEventListener("change", () => {
        imageType = input.value;
        setEditorError("");
      });
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
        fileInput.value = "";
        setEditorError("PNG, JPG, WEBP 이미지만 사용할 수 있습니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        fileInput.value = "";
        setEditorError("이미지 용량은 5MB 이하여야 합니다.");
        return;
      }

      sourceFile = file;
      pickButton.disabled = true;
      pickButton.textContent = "이미지 읽는 중";
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        pickButton.disabled = false;
        pickButton.textContent = "이미지 선택";
        sourceImage = image;
        showEditor();
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        pickButton.disabled = false;
        pickButton.textContent = "이미지 선택";
        fileInput.value = "";
        setEditorError("이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.");
      };
      image.src = objectUrl;
    });

    replaceButton.addEventListener("click", () => {
      workspace.classList.add("is-hidden");
      setup.classList.remove("is-hidden");
      fileInput.value = "";
      sourceFile = null;
      sourceImage = null;
      setEditorError("");
    });

    modal.querySelectorAll('input[name="editorFrame"]').forEach((input) => {
      input.addEventListener("change", () => {
        selection.dataset.frame = input.value;
      });
    });

    selection.addEventListener("pointerdown", startCropDrag);
    selection.addEventListener("keydown", (event) => {
      if (!/^Arrow/.test(event.key)) return;
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;
      const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
      const dy = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
      crop.x = clamp(crop.x + dx, 0, displaySize.width - crop.width);
      crop.y = clamp(crop.y + dy, 0, displaySize.height - crop.height);
      renderCrop();
    });

    applyButton.addEventListener("click", () => {
      if (!sourceImage) return;
      const definition = typeDefinitions[imageType];
      const frame = modal.querySelector('input[name="editorFrame"]:checked')?.value || "rectangle";
      const output = doc.createElement("canvas");
      output.width = definition.width;
      output.height = definition.height;
      const context = output.getContext("2d");
      const scaleX = sourceImage.naturalWidth / displaySize.width;
      const scaleY = sourceImage.naturalHeight / displaySize.height;

      context.save();
      if (frame === "ellipse") {
        context.beginPath();
        context.ellipse(output.width / 2, output.height / 2, output.width / 2, output.height / 2, 0, 0, Math.PI * 2);
        context.clip();
      }
      context.drawImage(
        sourceImage,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        output.width,
        output.height
      );
      context.restore();

      const result = output.toDataURL("image/png");
      [previewImage, uploadPreview].forEach((image) => {
        image.src = result;
        image.dataset.imageType = imageType;
        image.classList.toggle("is-ellipse", frame === "ellipse");
      });
      uploadZone?.classList.add("has-image");
      if (appliedType) appliedType.textContent = definition.label;
      if (appliedFrame) appliedFrame.textContent = frameLabels[frame];
      if (typeValue) typeValue.value = imageType;
      if (frameValue) frameValue.value = frame;
      applyPreviewLayout(imageType);
      if (cropValue) {
        cropValue.value = JSON.stringify({
          x: Number((crop.x / displaySize.width).toFixed(4)),
          y: Number((crop.y / displaySize.height).toFixed(4)),
          width: Number((crop.width / displaySize.width).toFixed(4)),
          height: Number((crop.height / displaySize.height).toFixed(4))
        });
      }
      closeModals();
      showToast("편집한 캐릭터 이미지를 적용했습니다.");
    });

    function applyPreviewLayout(type) {
      if (!previewSheet) return;
      const layoutClasses = {
        landscape: "profile-layout-horizontal",
        portrait: "profile-layout-vertical",
        square: "profile-layout-square"
      };
      previewSheet.classList.remove("profile-layout-horizontal", "profile-layout-vertical", "profile-layout-square");
      previewSheet.classList.add(layoutClasses[type] || layoutClasses.landscape);
      previewSheet.dataset.previewLayout = type;
      if (previewLayoutLabel) previewLayoutLabel.textContent = `${typeDefinitions[type]?.label || "가로형"} 프로필`;
    }

    function showEditor() {
      const definition = typeDefinitions[imageType];
      setup.classList.add("is-hidden");
      workspace.classList.remove("is-hidden");
      const availableWidth = Math.max(240, Math.min(660, stage.clientWidth - 36));
      const availableHeight = Math.max(260, Math.min(480, window.innerHeight * 0.52));
      const scale = Math.min(availableWidth / sourceImage.naturalWidth, availableHeight / sourceImage.naturalHeight, 1.5);
      displaySize = {
        width: Math.max(1, Math.round(sourceImage.naturalWidth * scale)),
        height: Math.max(1, Math.round(sourceImage.naturalHeight * scale))
      };

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(displaySize.width * pixelRatio);
      canvas.height = Math.round(displaySize.height * pixelRatio);
      canvas.style.width = `${displaySize.width}px`;
      canvas.style.height = `${displaySize.height}px`;
      canvasWrap.style.width = `${displaySize.width}px`;
      canvasWrap.style.height = `${displaySize.height}px`;
      const context = canvas.getContext("2d");
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, displaySize.width, displaySize.height);
      context.drawImage(sourceImage, 0, 0, displaySize.width, displaySize.height);

      crop = initialCrop(displaySize.width, displaySize.height, definition.ratio);
      modal.querySelector('input[name="editorFrame"][value="rectangle"]').checked = true;
      selection.dataset.frame = "rectangle";
      typeLabel.textContent = definition.label;
      fileName.textContent = sourceFile.name;
      outputSize.textContent = `${definition.width} × ${definition.height}px`;
      renderCrop();
    }

    function initialCrop(width, height, ratio) {
      let cropWidth = width * 0.82;
      let cropHeight = cropWidth / ratio;
      if (cropHeight > height * 0.82) {
        cropHeight = height * 0.82;
        cropWidth = cropHeight * ratio;
      }
      return {
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      };
    }

    function renderCrop() {
      selection.style.left = `${crop.x}px`;
      selection.style.top = `${crop.y}px`;
      selection.style.width = `${crop.width}px`;
      selection.style.height = `${crop.height}px`;
      setBox(shades.top, 0, 0, displaySize.width, crop.y);
      setBox(shades.bottom, 0, crop.y + crop.height, displaySize.width, displaySize.height - crop.y - crop.height);
      setBox(shades.left, 0, crop.y, crop.x, crop.height);
      setBox(shades.right, crop.x + crop.width, crop.y, displaySize.width - crop.x - crop.width, crop.height);
    }

    function setBox(element, x, y, width, height) {
      element.style.left = `${Math.max(0, x)}px`;
      element.style.top = `${Math.max(0, y)}px`;
      element.style.width = `${Math.max(0, width)}px`;
      element.style.height = `${Math.max(0, height)}px`;
    }

    function startCropDrag(event) {
      event.preventDefault();
      const handle = event.target.closest("[data-crop-handle]")?.dataset.cropHandle || "move";
      const point = editorPoint(event);
      dragState = { handle, startX: point.x, startY: point.y, crop: { ...crop } };
      selection.setPointerCapture?.(event.pointerId);
      selection.addEventListener("pointermove", moveCropDrag);
      selection.addEventListener("pointerup", endCropDrag, { once: true });
      selection.addEventListener("pointercancel", endCropDrag, { once: true });
    }

    function moveCropDrag(event) {
      if (!dragState) return;
      event.preventDefault();
      const point = editorPoint(event);
      if (dragState.handle === "move") {
        crop.x = clamp(dragState.crop.x + point.x - dragState.startX, 0, displaySize.width - crop.width);
        crop.y = clamp(dragState.crop.y + point.y - dragState.startY, 0, displaySize.height - crop.height);
      } else {
        resizeCrop(dragState.handle, point);
      }
      renderCrop();
    }

    function endCropDrag() {
      dragState = null;
      selection.removeEventListener("pointermove", moveCropDrag);
    }

    function resizeCrop(handle, point) {
      const base = dragState.crop;
      const right = handle.endsWith("e");
      const bottom = handle.startsWith("s");
      const anchorX = right ? base.x : base.x + base.width;
      const anchorY = bottom ? base.y : base.y + base.height;
      const maxWidthByX = right ? displaySize.width - anchorX : anchorX;
      const maxHeightByY = bottom ? displaySize.height - anchorY : anchorY;
      const ratio = typeDefinitions[imageType].ratio;
      const maxWidth = Math.max(1, Math.min(maxWidthByX, maxHeightByY * ratio));
      const minimumWidth = Math.min(72, maxWidth);
      const desiredWidth = Math.max(Math.abs(point.x - anchorX), Math.abs(point.y - anchorY) * ratio);
      const width = clamp(desiredWidth, minimumWidth, maxWidth);
      const height = width / ratio;
      crop = {
        x: right ? anchorX : anchorX - width,
        y: bottom ? anchorY : anchorY - height,
        width,
        height
      };
    }

    function editorPoint(event) {
      const rect = canvasWrap.getBoundingClientRect();
      return {
        x: clamp(event.clientX - rect.left, 0, displaySize.width),
        y: clamp(event.clientY - rect.top, 0, displaySize.height)
      };
    }

    function setEditorError(message) {
      error.textContent = message;
    }

    function clamp(value, minimum, maximum) {
      return Math.min(Math.max(value, minimum), maximum);
    }
  }

  doc.querySelectorAll("[data-comment-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const textarea = form.querySelector("textarea");
      const list = doc.querySelector("[data-comment-list]");
      const count = doc.querySelector("[data-comment-count]");
      const text = textarea?.value.trim();
      if (!text || !list) return;
      const article = doc.createElement("article");
      article.className = "comment";
      article.innerHTML = '<div class="comment-head"><span class="comment-author">방문자</span><span class="comment-time">방금 전</span></div><p></p>';
      article.querySelector("p").textContent = text;
      list.appendChild(article);
      textarea.value = "";
      if (count) count.textContent = String(Number(count.textContent || 0) + 1);
      showToast("코멘트를 남겼습니다.");
    });
  });

  doc.querySelectorAll("[data-setting-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const pressed = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(pressed));
      button.textContent = pressed ? "켜짐" : "꺼짐";
      button.classList.toggle("btn-primary", pressed);
      showToast(pressed ? "자동 재생을 켰습니다." : "자동 재생을 껐습니다.");
    });
  });
})();
