import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; content: string; imageUri: string | null }) => void;
}

const CATEGORIES = ['閱讀心得', '習慣打卡'];

const CreatePostModal = ({ visible, onClose, onSubmit }: CreatePostModalProps) => {
  const [category, setCategory] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('需要相簿權限才能上傳圖片！');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!category) {
      alert('請選擇分類');
      return;
    }
    onSubmit({ category, content, imageUri });
    setContent('');
    setCategory('');
    setImageUri(null);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => {
        if (isKeyboardVisible) Keyboard.dismiss();
        else onClose();
      }}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              className="w-full bg-white rounded-[20px] p-4 border-2 border-brand-light"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <View className="z-10 mb-3">
                <TouchableOpacity
                  className="flex-row justify-between items-center py-3 px-4 bg-white border border-brand rounded-xl"
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Text className={`text-base ${category ? 'text-[#333]' : 'text-[#999]'}`}>
                    {category || '今天要發什麼呢？'}
                  </Text>
                  <Ionicons name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View className="absolute top-full left-0 right-0 bg-[#FFF8E1] rounded-xl mt-1 border border-brand overflow-hidden z-20">
                    {CATEGORIES.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className="py-3 px-4 border-b border-brand-light"
                        onPress={() => { setCategory(item); setIsDropdownOpen(false); }}
                      >
                        <Text className="text-base text-[#555]">{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TextInput
                className="h-[150px] border border-brand rounded-xl p-3 text-base mb-4 text-[#333]"
                multiline
                placeholder="分享你的想法..."
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="mr-1" onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#4FD1C5" />
                </TouchableOpacity>
                {imageUri && (
                  <View className="relative">
                    <Image source={{ uri: imageUri }} className="w-[60px] h-20 rounded-lg bg-[#E0E0E0]" />
                    <TouchableOpacity
                      className="absolute bg-white rounded-[10px] -top-[5px] -right-[5px]"
                      onPress={() => setImageUri(null)}
                    >
                      <Ionicons name="close-circle" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
                {!imageUri && (
                  <TouchableOpacity
                    className="w-[60px] h-20 bg-[#F5F5F5] rounded-lg justify-center items-center border border-dashed border-[#ddd]"
                    onPress={pickImage}
                  >
                    <Ionicons name="add" size={20} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-4 items-end">
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-brand py-2 px-5 rounded-full"
                >
                  <Text className="text-white font-bold">發布</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CreatePostModal;