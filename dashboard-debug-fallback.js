function handleCVChangeInline(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameLabel = document.getElementById('cvFileName');
    const preview = document.getElementById('cvPreview');
    if (fileNameLabel) fileNameLabel.textContent = file.name;
    if (preview) preview.innerHTML = '<p style="margin:0; color:#64748b;">Archivo seleccionado, preparando vista previa...</p>';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const objectURL = URL.createObjectURL(file);
        if (preview) preview.innerHTML = `<iframe src="${objectURL}" style="width:100%; height:320px; border:none; border-radius:12px;"></iframe>`;
    } else {
        if (preview) preview.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;"><div><strong>Archivo:</strong> ${file.name}</div><div style="color:#475569;">Vista previa no disponible para este formato.</div></div>`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const cvInput = document.getElementById('cvInput');
    if (cvInput) {
        cvInput.addEventListener('change', handleCVChangeInline);
    }
});