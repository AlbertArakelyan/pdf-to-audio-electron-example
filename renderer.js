const { ipcRenderer } = require("electron");
const path = require("path");

async function convertPDF() {
  const pdfInput = document.getElementById("pdfInput");
  if (pdfInput.files.length === 0) {
    alert("Please select a PDF file.");
    return;
  }

  const filePath = pdfInput.files[0].path;
  console.log(1111, filePath);
  alert(JSON.stringify(pdfInput.files[0], null, 2));

  // Extract text from PDF
  const extractedText = await ipcRenderer.invoke("convert-pdf", filePath);

  // Convert extracted text to audio
  const audioPath = await ipcRenderer.invoke(
    "generate-audio",
    extractedText,
    "pdf_to_audio"
  );
  alert(`Audio generated successfully! Saved at: ${audioPath}`);
}

async function convertText() {
  const textInput = document.getElementById("textInput").value;

  if (!textInput) {
    alert("Please enter some text.");
    return;
  }

  // Generate audio from input text
  const audioPath = await ipcRenderer.invoke(
    "generate-audio",
    textInput,
    "text_to_audio"
  );
  alert(`Audio generated successfully! Saved at: ${audioPath}`);
}

async function textToAudio() {
  const textInput = document.getElementById("textInput").value;

  if (!textInput) {
    alert("Please enter some text.");
    return;
  }

  ipcRenderer.invoke("text-to-audio", textInput);
}
