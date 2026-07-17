import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { buildGrid } from "./utils";

const MONTH_NAMES_FULL = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const DAY_NAMES_S = ['S','M','T','W','T','F','S'];

export default function CalendarPickerModal({ visible, value, onSelect, onClose }) {
    const base = value || new Date();
    const [y, setY] = useState(base.getFullYear());
    const [m, setM] = useState(base.getMonth());
    const rows = buildGrid(y, m);
  
    function prevM() { if (m === 0) { setM(11); setY(v => v - 1); } else setM(v => v - 1); }
    function nextM() { if (m === 11) { setM(0); setY(v => v + 1); } else setM(v => v + 1); }
  
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 }}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-2xl overflow-hidden"
              style={{ elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16 }}>
  
              {/* Header */}
              <View className="bg-[#1B5E3B] px-5 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={prevM} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white text-xl font-bold">‹</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold text-base">{MONTH_NAMES_FULL[m]} {y}</Text>
                <TouchableOpacity onPress={nextM} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white text-xl font-bold">›</Text>
                </TouchableOpacity>
              </View>
  
              <View className="p-4">
                {/* Day labels */}
                <View className="flex-row mb-2">
                  {DAY_NAMES_S.map((n,index) => (
                    <View key={index} className="flex-1 items-center py-1">
                      <Text className="text-xs text-gray-400 font-semibold">{n}</Text>
                    </View>
                  ))}
                </View>
  
                {/* Date grid */}
                {rows.map((row, ri) => (
                  <View key={ri} className="flex-row mb-1">
                    {row.map((day, ci) => {
                      if (!day) return <View key={ci} className="flex-1 h-10" />;
                      const isSel = value &&
                        day === value.getDate() &&
                        m   === value.getMonth() &&
                        y   === value.getFullYear();
                      return (
                        <TouchableOpacity
                          key={ci}
                          className={`flex-1 h-10 rounded-xl items-center justify-center ${isSel ? 'bg-[#1B5E3B]' : ''}`}
                          onPress={() => onSelect(new Date(y, m, day))}
                          activeOpacity={0.7}
                        >
                          <Text className={`text-sm font-medium ${isSel ? 'text-white font-bold' : 'text-gray-700'}`}>{day}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
  
              <TouchableOpacity
                className="mx-4 mb-4 py-3 rounded-xl border border-gray-200 items-center"
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text className="text-gray-500 font-semibold text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }