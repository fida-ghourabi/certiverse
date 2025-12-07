// src/utils/pdfGenerator.js
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Download certificate HTML as PDF using html2canvas + jsPDF
 * @param {string} ipfsHash - The IPFS hash of the certificate
 * @param {string} certId - The certificate ID for filename
 * @param {string} gateway - Pinata gateway URL
 */
export const downloadCertificateAsPDF = async (ipfsHash, certId, gateway) => {
    try {
        console.log('[PDF] Starting generation for cert:', certId);

        // Fetch the HTML content from IPFS
        const cid = ipfsHash.replace('ipfs://', '');
        const url = `https://${gateway}/ipfs/${cid}`;
        console.log('[PDF] Fetching from:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error fetching certificate: HTTP ${response.status}`);

        const htmlContent = await response.text();
        console.log('[PDF] HTML fetched, length:', htmlContent.length);

        // Create a NEW window/iframe approach for better rendering
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '0';
        iframe.style.top = '0';
        iframe.style.width = '1122px'; // A4 landscape at 96dpi
        iframe.style.height = '794px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);

        // Write HTML to iframe
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();

        console.log('[PDF] HTML written to iframe, waiting for load...');

        // Wait for fonts and images to load
        await new Promise(resolve => {
            iframe.onload = () => {
                console.log('[PDF] Iframe loaded');
                setTimeout(resolve, 2000); // Extra time for fonts/images
            };
            // Fallback timeout
            setTimeout(resolve, 3000);
        });

        const contentElement = iframe.contentDocument.body;
        console.log('[PDF] Content element ready, capturing canvas...');

        // Capture as canvas
        const canvas = await html2canvas(contentElement, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#0f172a', // Match certificate background
            width: 1122,
            height: 794
        });

        console.log('[PDF] Canvas captured:', canvas.width, 'x', canvas.height);

        // Remove iframe
        document.body.removeChild(iframe);

        // Convert to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        console.log('[PDF] Adding image to PDF...');
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        console.log('[PDF] Saving...');
        pdf.save(`certificate-${certId}.pdf`);

        console.log('[PDF] Generation complete!');

        return { success: true };
    } catch (error) {
        console.error('[PDF] Generation error:', error);
        console.error('[PDF] Error stack:', error.stack);
        throw error;
    }
};

export default downloadCertificateAsPDF;
