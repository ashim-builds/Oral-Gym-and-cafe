import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import {
  resolveImageUrl,
  pickAndUploadImage,
  captureAndUploadPhoto,
} from '../services/image.service';

interface ImageUploadPickerProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  aspect?: [number, number];
  isCircular?: boolean;
}

export const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  label,
  value,
  onChange,
  aspect = [16, 9],
  isCircular = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const fullUrl = resolveImageUrl(value);

  const handlePickFromGallery = async () => {
    try {
      setUploading(true);
      const uploadedUrl = await pickAndUploadImage({ aspect });
      if (uploadedUrl) {
        onChange(uploadedUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setUploading(true);
      const uploadedUrl = await captureAndUploadPhoto({ aspect });
      if (uploadedUrl) {
        onChange(uploadedUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleManualUrlSave = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
    setUrlModalVisible(false);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Preview Box */}
      <View style={[styles.previewContainer, isCircular && styles.circularContainer]}>
        {uploading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        ) : fullUrl ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: fullUrl }}
              style={[styles.previewImage, isCircular && styles.circularImage]}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeBadge}
              onPress={handleRemove}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.placeholderBox, isCircular && styles.circularPlaceholder]}>
            <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.placeholderText}>No custom image uploaded</Text>
          </View>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handlePickFromGallery}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <Ionicons name="images-outline" size={15} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleCapturePhoto}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={15} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => {
            setUrlInput(value || '');
            setUrlModalVisible(true);
          }}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <Ionicons name="link-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.actionBtnTextSecondary}>Paste Link</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for manual URL input */}
      <Modal visible={urlModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Image Link / URL</Text>
              <TouchableOpacity onPress={() => setUrlModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.urlInput}
              placeholder="https://... or /uploads/..."
              placeholderTextColor={COLORS.textMuted}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUrlModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleManualUrlSave}
              >
                <Text style={styles.confirmBtnText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  previewContainer: {
    width: '100%',
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  circularImage: {
    borderRadius: 55,
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  circularPlaceholder: {
    borderRadius: 55,
  },
  placeholderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  actionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlInput: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
