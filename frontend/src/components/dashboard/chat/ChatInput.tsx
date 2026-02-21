import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api/client";

interface Props {
  fieldId: number;
  onSent?: () => void;
}

export default function ChatInput({ fieldId, onSent }: Props) {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ name: string; url: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ name: string; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    return () => {
      if (selectedImage?.url) {
        URL.revokeObjectURL(selectedImage.url);
      }
      if (selectedVideo?.url) {
        URL.revokeObjectURL(selectedVideo.url);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, [selectedImage, selectedVideo, cameraStream]);

  const submitMessage = async () => {
    const text = input.trim();
    if ((!text && !selectedImage && !selectedVideo) || !token || loading) return;
    setLoading(true);
    setInput("");
    try {
      let composed = text;
      if (selectedImage) {
        const imageNote = `[Image attached: ${selectedImage.name}]`;
        composed = composed ? `${composed}\n${imageNote}` : imageNote;
      }
      if (selectedVideo) {
        const videoNote = `[Video attached: ${selectedVideo.name}]`;
        composed = composed ? `${composed}\n${videoNote}` : videoNote;
      }
      await api.chat.send(token, fieldId, composed);
      if (selectedImage?.url) {
        URL.revokeObjectURL(selectedImage.url);
      }
      if (selectedVideo?.url) {
        URL.revokeObjectURL(selectedVideo.url);
      }
      setSelectedImage(null);
      setSelectedVideo(null);
      onSent?.();
    } catch (err) {
      console.error(err);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
    }
    const url = URL.createObjectURL(file);
    setSelectedImage({ name: file.name, url });
    event.target.value = "";
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (selectedVideo?.url) {
      URL.revokeObjectURL(selectedVideo.url);
    }
    const url = URL.createObjectURL(file);
    setSelectedVideo({ name: file.name, url });
    event.target.value = "";
  };

  const openCameraModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 1280, height: 720 }, 
        audio: false 
      });
      setCameraStream(stream);
      setShowMediaModal(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoPreviewRef.current || !cameraStream) {
      console.error("Video ref or camera stream not available");
      return;
    }
    
    const video = videoPreviewRef.current;
    
    // Ensure video has dimensions
    if (!video.videoWidth || !video.videoHeight) {
      alert("Camera is still loading. Please wait a moment and try again.");
      return;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          if (selectedImage?.url) {
            URL.revokeObjectURL(selectedImage.url);
          }
          const url = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          console.log("Photo captured:", { size: blob.size, type: blob.type, url });
          setSelectedImage({ name: `photo-${timestamp}.jpg`, url });
          closeMediaModal();
        } else {
          console.error("Failed to create blob from canvas");
          alert("Failed to capture photo. Please try again.");
        }
      }, "image/jpeg", 0.85);
    } catch (error) {
      console.error("Error capturing photo:", error);
      alert("Error capturing photo. Please try again.");
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;
    const recorder = new MediaRecorder(cameraStream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      if (selectedVideo?.url) URL.revokeObjectURL(selectedVideo.url);
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      setSelectedVideo({ name: `video-${timestamp}.webm`, url });
      closeMediaModal();
    };
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    recorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const closeMediaModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setShowMediaModal(false);
    setIsRecording(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 p-2 rounded-3xl glass-panel border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-300 transition-all shadow-lg">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="Attach"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showAttachMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAttachMenu(false)} />
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 w-48 z-20">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Upload image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openCameraModal();
                    setShowAttachMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86c.69 0 1.33.35 1.7.9l.82 1.2c.4.6 1.06.9 1.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span className="font-medium">Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Upload video</span>
                </button>
              </div>
            </>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AgriAI..."
          rows={1}
          className="flex-1 min-h-[40px] max-h-[120px] py-2.5 px-2 bg-transparent text-gray-900 placeholder-gray-500 resize-none outline-none text-base"
          disabled={loading}
        />

        <button
          type="button"
          onClick={isListening ? stopVoiceInput : startVoiceInput}
          className={`p-2.5 rounded-full transition-all ${isListening ? "text-white bg-emerald-600 shadow-lg animate-pulse" : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
          title="Voice input"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button
          type="submit"
          disabled={(!input.trim() && !selectedImage && !selectedVideo) || loading}
          className="flex-shrink-0 p-2.5 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {selectedImage && (
        <div className="mt-2 flex items-center gap-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50">
          <img 
            src={selectedImage.url} 
            alt={selectedImage.name} 
            className="w-16 h-16 rounded-xl object-cover shadow" 
            onError={(e) => {
              console.error("Image load error:", selectedImage.url);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log("Image loaded successfully")}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{selectedImage.name}</p>
            <p className="text-xs text-gray-600">Image ready</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedImage?.url) URL.revokeObjectURL(selectedImage.url);
              setSelectedImage(null);
            }}
            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {selectedVideo && (
        <div className="mt-2 flex items-center gap-3 p-3 rounded-2xl border border-purple-200 bg-purple-50/50">
          <video src={selectedVideo.url} className="w-16 h-16 rounded-xl object-cover shadow" muted />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{selectedVideo.name}</p>
            <p className="text-xs text-gray-600">Video</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedVideo?.url) URL.revokeObjectURL(selectedVideo.url);
              setSelectedVideo(null);
            }}
            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2 text-center">AgriAI can make mistakes. Check important info.</p>

      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">Camera</h3>
              <button type="button" onClick={closeMediaModal} className="p-2 rounded-full hover:bg-white/20 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative bg-black">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-auto max-h-[60vh] object-contain" />
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-semibold">Recording</span>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-center gap-4 bg-gray-50">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isRecording}
                className="p-4 rounded-full bg-white border-4 border-emerald-500 hover:border-emerald-600 disabled:opacity-40 transition shadow-lg"
                title="Photo"
              >
                <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg"
                  title="Record"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-4 rounded-full bg-gray-800 hover:bg-gray-900 text-white transition shadow-lg"
                  title="Stop"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
