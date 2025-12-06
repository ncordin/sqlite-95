import React, { useState, useRef, useEffect } from 'react';

import { Shortcut } from '../components/Shortcut';
import { ContentModal } from '../components/Modal';
import { GroupBox, Button, ProgressBar } from 'react95';
import { useApi } from '../utils/useApi';
import { formatFileSize } from '../utils/formatFileSize';
import { Space } from '../components/Space';

const MIN_UPLOAD_DURATION = 1000;

export function Upload({ onUploadComplete }) {
  const { uploadDatabase } = useApi();
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isUploading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 50);

    return () => clearInterval(interval);
  }, [isUploading]);

  const openModal = () => {
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const startTime = Date.now();
    setIsUploading(true);
    setProgress(0);

    try {
      await uploadDatabase(selectedFile);

      // Ensure minimum duration for visual effect
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_UPLOAD_DURATION) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_UPLOAD_DURATION - elapsed)
        );
      }

      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 200));

      setShowModal(false);
      setSelectedFile(null);
      onUploadComplete?.();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Shortcut icon="floppy" name="Import" onClick={openModal} />

      {showModal && (
        <ContentModal
          title="Import database"
          onClose={() => setShowModal(false)}
        >
          <GroupBox label="Select a .db file">
            <input
              ref={fileInputRef}
              type="file"
              accept=".db"
              onChange={handleFileSelect}
              style={{ margin: 4 }}
            />
            {selectedFile && (
              <p style={{ margin: '8px 0' }}>
                Selected: {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </GroupBox>

          <Space vertical size={1} />

          <ProgressBar value={progress} />

          <Space vertical size={0.5} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              primary
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading...' : 'Import'}
            </Button>
          </div>
        </ContentModal>
      )}
    </>
  );
}
