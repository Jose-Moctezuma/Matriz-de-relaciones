import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Exporta a PDF con pre-procesamiento para asegurar que los colores se capturen.
 * Esta versión hace el elemento visible temporalmente si está oculto.
 * @param {React.RefObject<HTMLElement>} ref - ref al contenedor del "reporte PDF"
 * @param {string} filename - nombre del PDF
 */
export async function exportMatrixPDF(ref, filename = "matriz-relaciones.pdf") {
  const el = ref?.current;
  if (!el) return;

  // Guardar estilos originales
  const originalPosition = el.style.position;
  const originalLeft = el.style.left;
  const originalTop = el.style.top;
  const originalZIndex = el.style.zIndex;

  try {
    // Forzar que el elemento sea visible y esté en el viewport
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.zIndex = "9999";

    // Forzar repaint
    el.style.display = "block";
    void el.offsetHeight; // Trigger reflow

    // Esperar más tiempo para asegurar que todo esté renderizado
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      logging: true,                     // Activar logs para debug
      imageTimeout: 0,
      removeContainer: true,
      foreignObjectRendering: false,
      scrollY: 0,
      scrollX: 0,
      // Opciones adicionales para mejorar captura de elementos transformados
      onclone: (clonedDoc) => {
        // En el documento clonado, asegurar que los estilos estén presentes
        const clonedEl = clonedDoc.querySelector('[data-matrix-pdf]');
        if (clonedEl) {
          // Forzar estilos inline para asegurar captura
          const allElements = clonedEl.querySelectorAll('*');
          allElements.forEach((elem) => {
            const computedStyle = window.getComputedStyle(elem);
            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              elem.style.backgroundColor = computedStyle.backgroundColor;
            }
          });
        }
      }
    });

    const imgData = canvas.toDataURL("image/png", 1.0);

    // Restaurar estilos originales
    el.style.position = originalPosition;
    el.style.left = originalLeft;
    el.style.top = originalTop;
    el.style.zIndex = originalZIndex;

    // PDF A4 horizontal (landscape)
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, (pageH - imgH) / 2, imgW, imgH);
    } else {
      let remaining = imgH;
      let position = 0;
      while (remaining > 0) {
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        remaining -= pageH;
        position -= pageH;
        if (remaining > 0) pdf.addPage();
      }
    }

    pdf.save(filename);
  } catch (error) {
    // Restaurar estilos en caso de error
    el.style.position = originalPosition;
    el.style.left = originalLeft;
    el.style.top = originalTop;
    el.style.zIndex = originalZIndex;
    
    console.error("Error al generar PDF:", error);
    alert("Hubo un error al generar el PDF. Por favor, intenta de nuevo.");
  }
}