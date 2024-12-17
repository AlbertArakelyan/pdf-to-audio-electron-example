const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const say = require("say");
const gTTS = require("gtts");

let mainWindow;

// Create the Electron window
app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'), // Secure communication
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
});

const audioDir = path.join(__dirname, "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Handle PDF to Text conversion
ipcMain.handle("convert-pdf", async (_, filePath) => {
  console.log("filePath", filePath);
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  return pdfData.text; // Extracted text
});

// Handle Text-to-Audio generation
ipcMain.handle("generate-audio", (_, text, fileName) => {
  const safeFileName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase(); // Sanitize file name
  const audioPath = path.join(audioDir, `${safeFileName}.wav`);
  return new Promise((resolve, reject) => {
    say.export(text, null, 1.0, audioPath, (err) => {
      if (err) {
        console.error("Error exporting audio:", err);
        reject(new Error(`Failed to generate audio: ${err.message}`));
      } else {
        console.log("Audio generated successfully:", audioPath);
        resolve(audioPath);
      }
    });
  });
});

ipcMain.handle("text-to-audio", async (_, text, lang = "en") => {
  return new Promise((resolve, reject) => {
    try {
      if (!text || !text.trim()) {
        return reject(new Error("No text provided or text is empty"));
      }

      // Set audio file name
      const audioPath = path.join(
        audioDir,
        `text-to-audio__output-${Date.now()}.mp3`
      );

      // Convert text to audio
      const gtts = new gTTS(text, lang);
      gtts.save(audioPath, (err) => {
        if (err) {
          console.error("Error generating audio:", err);
          return reject(new Error("Failed to generate audio"));
        }
        console.log("Audio generated successfully:", audioPath);
        resolve(audioPath);
      });
    } catch (error) {
      console.error("Error processing text-to-audio:", error);
      reject(new Error("Internal processing error"));
    }
  });
});

// text-to-audio and generate-audio event handlers do the same thing, just with to different
// pakcages, gtts is by Google and converts with higher quaility

ipcMain.handle("pdf-to-audio", async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Open file dialog to select a PDF
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Select a PDF File",
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
        properties: ["openFile"],
      });

      if (canceled || filePaths.length === 0) {
        return reject(new Error("No file selected"));
      }

      const pdfPath = filePaths[0];
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Extract text from PDF
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      if (!text.trim()) {
        return reject(new Error("No readable text found in the PDF"));
      }

      // Convert text to audio
      const audioPath = path.join(
        audioDir,
        `pdf-to-audio__output-${Date.now()}.mp3`
      );
      const gtts = new gTTS(text, "en");
      gtts.save(audioPath, (err) => {
        if (err) {
          console.error("Error generating audio:", err);
          return reject(new Error("Error generating audio"));
        }

        console.log("Audio file generated:", audioPath);
        resolve(audioPath);
      });
    } catch (error) {
      console.error("Error processing PDF to audio:", error);
      reject(new Error("Failed to process PDF"));
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
