import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';
import shopService from '../../services/shop.service';
import { ImageUploadPicker } from '../../components/ImageUploadPicker';

export const AdminBusinessOwnerScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'business' | 'owner'>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Business form state
  const [bName, setBName] = useState('');
  const [bTagline, setBTagline] = useState('');
  const [bDescription, setBDescription] = useState('');
  const [bMission, setBMission] = useState('');
  const [bVision, setBVision] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bHeroBanner, setBHeroBanner] = useState('');
  const [bLogo, setBLogo] = useState('');

  // Owner form state
  const [oName, setOName] = useState('');
  const [oTitle, setOTitle] = useState('');
  const [oBio, setOBio] = useState('');
  const [oExperience, setOExperience] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oEmail, setOEmail] = useState('');
  const [oPhoto, setOPhoto] = useState('');
  const [oInstagram, setOInstagram] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [biz, own] = await Promise.all([
        shopService.getBusinessDetails(),
        shopService.getOwnerDetails(),
      ]);

      if (biz) {
        setBName(biz.name || '');
        setBTagline((biz as any).tagline || '');
        setBDescription(biz.description || '');
        setBMission(biz.mission || '');
        setBVision(biz.vision || '');
        setBEmail(biz.email || '');
        setBPhone(biz.phone || '');
        setBAddress(biz.address || '');
        setBHeroBanner((biz as any).hero_banner || '');
        setBLogo((biz as any).logo || '');
      }

      if (own) {
        setOName(own.name || '');
        setOTitle(own.position || (own as any).title || '');
        setOBio(own.biography || (own as any).bio || '');
        setOExperience(own.experience || '');
        setOPhone(own.contact || (own as any).phone || '');
        setOEmail((own as any).email || '');
        setOPhoto((own as any).photo || '');
        setOInstagram(own.social_links?.instagram || '');
      }
    } catch (err) {
      console.error('Failed to load business/owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      await mobileAdminService.updateBusiness({
        name: bName.trim(),
        tagline: bTagline.trim(),
        description: bDescription.trim(),
        mission: bMission.trim(),
        vision: bVision.trim(),
        email: bEmail.trim(),
        phone: bPhone.trim(),
        address: bAddress.trim(),
        hero_banner: bHeroBanner.trim() || undefined,
        logo: bLogo.trim() || undefined,
      });
      Alert.alert('Success', 'Business details updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwner = async () => {
    try {
      setSaving(true);
      await mobileAdminService.updateOwner({
        name: oName.trim(),
        title: oTitle.trim(),
        position: oTitle.trim(),
        bio: oBio.trim(),
        biography: oBio.trim(),
        experience: oExperience.trim(),
        experience_years: parseInt(oExperience, 10) || 0,
        phone: oPhone.trim(),
        contact: oPhone.trim(),
        email: oEmail.trim(),
        photo: oPhoto.trim() || undefined,
        social_links: {
          instagram: oInstagram.trim(),
        },
      });
      Alert.alert('Success', 'Owner profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update owner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business & Owner Info</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'business' && styles.tabBtnActive]}
            onPress={() => setActiveTab('business')}
          >
            <Ionicons
              name="business-outline"
              size={16}
              color={activeTab === 'business' ? COLORS.backgroundDark : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'business' && styles.tabTextActive]}>
              Business Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'owner' && styles.tabBtnActive]}
            onPress={() => setActiveTab('owner')}
          >
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={activeTab === 'owner' ? COLORS.backgroundDark : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'owner' && styles.tabTextActive]}>
              Owner & Coach
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
          {activeTab === 'business' ? (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.input}
                  value={bName}
                  onChangeText={setBName}
                  placeholder="Orla Gym and Cafe"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tagline</Text>
                <TextInput
                  style={styles.input}
                  value={bTagline}
                  onChangeText={setBTagline}
                  placeholder="Strength. Health. Family. Legacy."
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Custom Hero Banner & Logo Uploads */}
              <ImageUploadPicker
                label="Business Hero Banner (About Screen)"
                value={bHeroBanner}
                onChange={setBHeroBanner}
                aspect={[16, 9]}
              />

              <ImageUploadPicker
                label="Brand Logo"
                value={bLogo}
                onChange={setBLogo}
                aspect={[1, 1]}
                isCircular={true}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About Business / Story</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bDescription}
                  onChangeText={setBDescription}
                  placeholder="Tell customers about your gym and supplement store..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mission Statement</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bMission}
                  onChangeText={setBMission}
                  placeholder="Our mission is to empower..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vision</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bVision}
                  onChangeText={setBVision}
                  placeholder="Our vision is..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Support Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={bPhone}
                    onChangeText={setBPhone}
                    placeholder="+977 1 4220000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Support Email</Text>
                  <TextInput
                    style={styles.input}
                    value={bEmail}
                    onChangeText={setBEmail}
                    placeholder="info@orlagym.com"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Main HQ Address</Text>
                <TextInput
                  style={styles.input}
                  value={bAddress}
                  onChangeText={setBAddress}
                  placeholder="Putalisadak, Kathmandu, Nepal"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveBusiness}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.backgroundDark} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Business Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Founder Portrait Photo Upload */}
              <ImageUploadPicker
                label="Founder / Head Coach Portrait Photo"
                value={oPhoto}
                onChange={setOPhoto}
                aspect={[1, 1]}
                isCircular={true}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Owner / Head Coach Name</Text>
                <TextInput
                  style={styles.input}
                  value={oName}
                  onChangeText={setOName}
                  placeholder="e.g. Dhiraj Gharti (Orla Dad)"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Professional Title</Text>
                <TextInput
                  style={styles.input}
                  value={oTitle}
                  onChangeText={setOTitle}
                  placeholder="Founder & Head Fitness Coach"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={oExperience}
                  onChangeText={setOExperience}
                  placeholder="e.g. 12"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coach Biography / Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={oBio}
                  onChangeText={setOBio}
                  placeholder="Share your athletic journey, coaching background, certifications..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={5}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Coach Contact Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={oPhone}
                    onChangeText={setOPhone}
                    placeholder="+977 9801234567"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Coach Email</Text>
                  <TextInput
                    style={styles.input}
                    value={oEmail}
                    onChangeText={setOEmail}
                    placeholder="coach@orlagym.com"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instagram Handle / URL</Text>
                <TextInput
                  style={styles.input}
                  value={oInstagram}
                  onChangeText={setOInstagram}
                  placeholder="https://instagram.com/orlagym"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>


              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveOwner}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.backgroundDark} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Owner Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    backgroundColor: COLORS.surfaceDark,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceDark,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceDarker,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.backgroundDark,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
