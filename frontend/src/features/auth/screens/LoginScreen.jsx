// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

// export default function LoginScreen({navigation}) {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   return (
//     <View className="flex-1 bg-[#0a5c36] justify-center items-center">
//       <View className="w-[85%] bg-white rounded-[20px] border border-[#E0E0E0] p-5 items-center">
//         {/* Logo */}
//         <Image
//           source={require("../../../assets/images/login_logo.jpeg")}
//           className="w-20 h-20 mb-[10px]"
//           resizeMode="contain"
//         />

//         {/* Heading */}
//         <Text className="text-[20px] font-bold text-[#198754] mb-5">
//           Performance Dashboard
//         </Text>

//         {/* Email */}
//         <TextInput
//           placeholder="Email"
//           placeholderTextColor="#999"
//           value={email}
//           onChangeText={setEmail}
//           className="w-full h-[45px] border border-[#DDD] rounded-[10px] px-[10px] mb-3 bg-white"
//           keyboardType="email-address"
//           autoCapitalize="none"
//         />

//         {/* Password */}
//         <TextInput
//           placeholder="Password"
//           placeholderTextColor="#999"
//           value={password}
//           onChangeText={setPassword}
//           className="w-full h-[45px] border border-[#DDD] rounded-[10px] px-[10px] mb-3 bg-white"
//           secureTextEntry
//         />

//         {/* Login Button */}
//         <TouchableOpacity
//           className="w-full bg-[#198754] py-3 rounded-[10px] items-center mt-[5px] mb-[15px]"
//           onPress={() => {
//             if (!email || !password) {
//               Alert.alert("Enter email and password");
//               return;
//             }
//             navigation.replace("Register");
//           }}
//         >
//           <Text className="text-white font-bold">Login</Text>
//         </TouchableOpacity>

//         {/* Links */}
//         <TouchableOpacity
//           onPress={() => navigation.replace("Dashboard", { role: "management" })}
//         >
//           <Text className="text-[#0A92E2] underline mt-2 text-[14px]">
//             Test as Management
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
// onPress={() =>
//   navigation.replace("Dashboard", {
//     role: "user",
//     activeItemId: "personal-calendar",
//   })
// }          >
//           <Text className="text-[#0A92E2] underline mt-2 text-[14px]">
//             Test as User
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

//-----------------------------------------------------------------------------//


import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";

export default function LoginScreen({ navigation }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log('login data: ',data);
      

      // Save token to local storage or secure storage
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Check user role and navigate accordingly
      const userRole = data.user.role ? data.user.role.toLowerCase() : "";
      if (userRole === "management" || userRole === "jmanagement") {
        console.log('1');
        navigation.replace("Dashboard", { role: userRole });
      } else if (userRole === "admin") {
        console.log('admin');
        navigation.replace("Register");
      } else {
        console.log('2');
        navigation.replace("Dashboard", {
          role: "user",
          activeItemId: "personal-calendar",
        });
      }
    } catch (error) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a5c36] justify-center items-center">
      <View className="w-[85%] bg-white rounded-[20px] border border-[#E0E0E0] p-5 items-center">
        {/* Logo */}
        <Image
          source={require("../../../assets/images/login_logo.jpeg")}
          className="w-20 h-20 mb-[10px]"
          resizeMode="contain"
        />

        {/* Heading */}
        <Text className="text-[20px] font-bold text-[#198754] mb-5">
          Performance Dashboard
        </Text>

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          className="w-full h-[45px] border border-[#DDD] rounded-[10px] px-[10px] mb-3 bg-white"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          className="w-full h-[45px] border border-[#DDD] rounded-[10px] px-[10px] mb-3 bg-white"
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity
          className="w-full bg-[#198754] py-3 rounded-[10px] items-center mt-[5px] mb-[15px]"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-bold">{loading ? "Logging in..." : "Login"}</Text>
        </TouchableOpacity>

        {/* Test Autofill Links */}
        <TouchableOpacity
          onPress={() => {
            setEmail("management@example.com");
            setPassword("management123");
          }}
          className="mt-3"
          activeOpacity={0.7}
        >
          <Text className="text-[#0A92E2] underline text-[14px] font-semibold">
            Test as Management
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setEmail("admin@example.com");
            setPassword("password123");
          }}
          className="mt-2.5"
          activeOpacity={0.7}
        >
          <Text className="text-[#0A92E2] underline text-[14px] font-semibold">
            Test as User
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}