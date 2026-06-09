import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FORM_SUBJECTS = ['數學', '英文', '自然', '國文', '社會', '其他'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { subject: string; title: string; content: string; isAnonymous: boolean }) => Promise<unknown>;
}

export default function NewThreadModal({ visible, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [formSubject, setFormSubject] = useState(FORM_SUBJECTS[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ subject: formSubject, title: formTitle.trim(), content: formContent.trim(), isAnonymous });
      onClose();
      setFormTitle('');
      setFormContent('');
      setFormSubject(FORM_SUBJECTS[0]);
      setIsAnonymous(false);
    } catch (err) {
      console.error('[NewThreadModal] 新增討論失敗:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <View className="bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-[#eee]">
            <Text className="text-base font-bold text-navy">新增討論</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View className="px-5 pt-4 gap-4">
            <View>
              <Text className="text-xs font-semibold text-[#666] mb-2">科目</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FORM_SUBJECTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFormSubject(s)}
                    className={`mr-2 px-4 py-2 rounded-full ${formSubject === s ? 'bg-brand' : 'bg-[#f0f0f0]'}`}
                  >
                    <Text className={`text-sm font-semibold ${formSubject === s ? 'text-white' : 'text-[#666]'}`}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-xs font-semibold text-[#666] mb-2">標題</Text>
              <TextInput
                placeholder="簡短描述你的問題"
                value={formTitle}
                onChangeText={setFormTitle}
                maxLength={100}
                className="bg-[#f5f5f5] rounded-xl px-4 py-3 text-sm text-[#333]"
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-[#666] mb-2">內容</Text>
              <TextInput
                placeholder="詳細說明你的問題..."
                value={formContent}
                onChangeText={setFormContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-[#f5f5f5] rounded-xl px-4 py-3 text-sm text-[#333]"
                style={{ minHeight: 100 }}
              />
            </View>

            <View className="flex-row items-center justify-between py-1">
              <View>
                <Text className="text-xs font-semibold text-[#666]">匿名發問</Text>
                <Text className="text-[10px] text-[#aaa] mt-0.5">其他人看不到你的名字</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#e0e0e0', true: '#65A1FB' }}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !formTitle.trim() || !formContent.trim()}
              className="rounded-xl py-3 items-center justify-center bg-brand mt-1"
              style={{ opacity: submitting || !formTitle.trim() || !formContent.trim() ? 0.5 : 1 }}
            >
              {submitting
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-semibold">發佈問題</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
