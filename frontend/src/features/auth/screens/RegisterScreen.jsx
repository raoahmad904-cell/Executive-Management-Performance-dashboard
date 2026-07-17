import { CommonActions } from "@react-navigation/native";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AllUsersScreen from "./AllUsersScreen";

function Dropdown({ label, value, options, placeholder = "Select...", error, onChange }) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View className="mb-3 w-full">
      {label ? <Text className="text-gray-700 mb-2 font-semibold">{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        className={`border rounded-xl px-3 py-3 bg-white flex-row items-center justify-between ${error ? "border-red-500" : "border-gray-300"
          }`}
      >
        <Text className={`${value ? "text-gray-900" : "text-gray-400"} text-base`}>
          {selectedLabel ?? placeholder}
        </Text>
        <Text className="text-gray-500 text-base">▾</Text>
      </Pressable>

      {!!error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-6" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-2xl max-h-[70%] overflow-hidden" onPress={() => { }}>
            <View className="px-4 py-4 border-b border-gray-200">
              <Text className="text-gray-900 font-bold text-lg">{label || "Select"}</Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`px-4 py-4 border-b border-gray-100 ${isSelected ? "bg-green-50" : "bg-white"}`}
                  >
                    <Text className={`text-base ${isSelected ? "text-green-700 font-semibold" : "text-gray-800"}`}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("");
  const [sector, setSector] = useState("");
  const [section, setSection] = useState("");

  // Per-field errors
  const [errors, setErrors] = useState({});

  const [activeView, setActiveView] = useState("addUser"); // 'addUser' | 'viewAll'

  const designationOptions = [
    { label: "Member", value: "Member" },
    { label: "Consultant", value: "Consultant" },
    { label: "Minister", value: "Minister" },
    { label: "Secretory", value: "Secretory" },
    { label: "Additional secretory", value: "Additional secretory" },
    { label: "Cheif Economist", value: "Cheif Economist" },
    { label: "JS Admin", value: "JS Admin" },
    { label: "Admin", value: "Admin" },
    { label: "Chiefs", value: "Chiefs" },
    { label: "JCE", value: "JCE" },
    { label: "Deputy Chiefs", value: "Deputy Chiefs" },
    { label: "Sector Specialist", value: "Sector Specialist" },
    { label: "Project Director", value: "Project Director" },
  ];

  const roleOptions = [
    { label: "User", value: "user" },
    { label: "Management", value: "management" },
    { label: "jManagement", value: "jManagement" },
    { label: "Admin", value: "admin" },
  ];

  const sectorOptions = [
    { label: "Science & IT", value: "it" },
    { label: "Infrastructure", value: "infra" },
    { label: "Private Sector Development & Competitiveness", value: "Private Sector Development & Competitiveness" },
    { label: "Implementation & Monitoring", value: "Implementation & Monitoring" },
    { label: "Development Communication", value: "Development Communication" },
    { label: "Food Security & Climate Change", value: "Food Security & Climate Change" },
    { label: "Social Sector & Population", value: "Social Sector & Population" },
    { label: "Government Innovation Reform", value: "Government Innovation Reform" },
    { label: "Energy", value: "energy" },
    { label: "Special Areas", value: "Special Areas" },
    { label: "Economics", value: "Economics" },
    { label: "Finance", value: "Finance" },
    { label: "Trade", value: "Trade" },
    { label: "Public Sector", value: "Public Sector" },
    { label: "Human Resource Management", value: "hr" },
  ];

  const sectionOptions = [
    { label: "Technical Section", value: "tech" },
    { label: "Economic Section", value: "eco" },
  ];

  // JCE is now included — shows Section instead of Sector
  const isChief =
    designation === "Chiefs" ||
    designation === "Deputy Chiefs" ||
    designation === "JCE";

  const isManagementRole =
    role === "management" || role === "jManagement" || role === "admin";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function handleRegister() {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!designation) {
      newErrors.designation = "Designation is required.";
    }

    if (!role) {
      newErrors.role = "Role is required.";
    }

    if (!isChief && !isManagementRole) {
      if (!sector) {
        newErrors.sector = "Sector is required.";
      }
    }

    if (isChief && !isManagementRole) {
      if (!section) {
        newErrors.section = "Section is required.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // All fields valid
    setErrors({});
    setShowSuccess(true);
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Dropdown Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity className="flex-1" onPress={() => setShowMenu(false)}>
          <View className="absolute top-12 right-4 bg-white rounded-lg shadow-lg p-2 min-w-[160px]">
            <TouchableOpacity className="py-2 px-3">
              <Text className="text-gray-700 text-sm">Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-2 px-3">
              <Text className="text-gray-700 text-sm">Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Notification Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl mx-8 p-8 items-center shadow-xl">
            {/* Checkmark circle */}
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <Text className="text-green-600 text-3xl font-bold">✓</Text>
            </View>
            <Text className="text-green-700 font-bold text-xl mb-2">
              Account Registered
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-6">
              The new user account has been successfully created.
            </Text>
            <TouchableOpacity
              className="bg-green-600 rounded-xl px-8 py-3 w-full items-center"
              onPress={() => {
                setShowSuccess(false);
                // Reset form
                setName("");
                setEmail("");
                setPassword("");
                setDesignation("");
                setRole("");
                setSector("");
                setSection("");
                setErrors({});
                navigation?.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  })
                );
              }}
            >
              <Text className="text-white font-semibold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Admin Panel Bar */}
      <View className="bg-[#0c3b2e] mt-10 py-4 items-center">
        <Text className="text-white font-bold text-2xl">Admin Panel</Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-4 py-3 gap-3">
        <TouchableOpacity
          className={`px-4 py-2 rounded flex-row items-center ${activeView === "addUser" ? "bg-[#0c3b2e]" : "bg-[#1a5c46]"
            }`}
          onPress={() => setActiveView("addUser")}
        >
          <Text className="text-yellow-400 font-semibold text-sm">
            + Add User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-4 py-2 rounded flex-row items-center ${activeView === "viewAll" ? "bg-[#0c3b2e]" : "bg-[#1a5c46]"
            }`}
          onPress={() => navigation.replace("AllUsers")}
        >
          <Text className="text-yellow-400 font-semibold text-sm">
            View All Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {activeView === "addUser" ? (
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            paddingVertical: 24,
            paddingHorizontal: 16,
          }}
        >
          {/* Register Card */}
          <View className="bg-white rounded-2xl w-full max-w-md p-6 shadow-md">
            <Text className="text-green-700 font-bold text-2xl text-center mb-6">
              Register
            </Text>

            {/* Name */}
            <TextInput
              placeholder="Name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              className={`border rounded px-3 py-2 mb-1 text-gray-800 ${errors.name ? "border-red-500" : "border-gray-300"
                }`}
              style={{ height: 48, fontSize: 16 }}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mb-3">{errors.name}</Text>
            )}
            {!errors.name && <View className="mb-3" />}

            {/* Email */}
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email)
                  setErrors((e) => ({ ...e, email: undefined }));
              }}
              className={`border rounded px-3 py-2 mb-1 text-gray-800 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
              style={{ height: 48, fontSize: 16 }}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mb-3">{errors.email}</Text>
            )}
            {!errors.email && <View className="mb-3" />}

            {/* Password */}
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              className={`border rounded px-3 py-2 mb-1 text-gray-800 ${errors.password ? "border-red-500" : "border-gray-300"
                }`}
              style={{ height: 48, fontSize: 16 }}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mb-3">
                {errors.password}
              </Text>
            )}
            {!errors.password && <View className="mb-3" />}


            <Dropdown
              // label="Designation"
              value={designation}
              options={designationOptions}
              placeholder="Select Designation"
              error={errors.designation}
              onChange={(val) => {
                setDesignation(val);
                if (errors.designation) setErrors((e) => ({ ...e, designation: undefined }));
                setSector("");
                setSection("");
              }}
            />

            <Dropdown
              // label="Role"
              value={role}
              options={roleOptions}
              placeholder="Select Role"
              error={errors.role}
              onChange={(val) => {
                setRole(val);
                if (errors.role) setErrors((e) => ({ ...e, role: undefined }));
                setSector("");
                setSection("");
              }}
            />

            {!isChief && !isManagementRole && (
              <Dropdown
                // label="Sector"
                value={sector}
                options={sectorOptions}
                placeholder="Select Sector"
                error={errors.sector}
                onChange={(val) => {
                  setSector(val);
                  if (errors.sector) setErrors((e) => ({ ...e, sector: undefined }));
                }}
              />
            )}

            {isChief && !isManagementRole && (
              <Dropdown
                // label="Section"
                value={section}
                options={sectionOptions}
                placeholder="Select Section"
                error={errors.section}
                onChange={(val) => {
                  setSection(val);
                  if (errors.section) setErrors((e) => ({ ...e, section: undefined }));
                }}
              />
            )}


            {/* Register Button */}
            <TouchableOpacity
              className="bg-green-600 rounded py-3 items-center mt-2"
              onPress={handleRegister}
            >
              <Text className="text-white font-semibold text-base">
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <AllUsersScreen />
      )}
    </View>
  );
}