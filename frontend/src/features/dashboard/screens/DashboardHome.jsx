import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DirectivesSection from "../components/DirectivesSection";
import FullscreenLandscapeCard from "../components/FullscreenLandscapeCard";
import StatCard from "../components/StatCard";
import YearlyTrendlineChart from "../components/YearlyTrendlineChart";

const PROGRESS_FACET_OPTIONS = [
  { label: "Directives", value: "Directives" },
  { label: "Tasks", value: "Tasks" },
];

const DESIGNATION_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Member", value: "Member" },
  { label: "Consultant", value: "Consultant" },
  { label: "Secretary", value: "Secretary" },
  { label: "Additional Secretary", value: "Additional Secretary" },
  { label: "JS Admin", value: "JS Admin" },
  { label: "Chief Economist", value: "Chief Economist" },  
  { label: "JCE", value: "JCE" },
  { label: "Sector Specialist", value: "Sector Specialist" },
  { label: "Project Director", value: "Project Director" },
];

export default function DashboardHome() {
  const [progressFacet, setProgressFacet] = useState("Directives");
  const [designation, setDesignation] = useState("All");
  const [officer, setOfficer] = useState("All");
  const [officerOptions, setOfficerOptions] = useState([{ label: "All", value: "All" }]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProcess: 0, overdue: 0 });
  const [trendData, setTrendData] = useState(null);

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Dashboard` });
  }, [nav]);

  // 1. Fetch officers list when designation changes
  useEffect(() => {
    setOfficer("All");
    if (designation === "All") {
      setOfficerOptions([{ label: "All", value: "All" }]);
      return;
    }

    const fetchOfficers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/auth/users?designation=${designation}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const options = [{ label: "All", value: "All" }, ...data.map(u => ({ label: u.name, value: u._id }))];
          setOfficerOptions(options);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOfficers();
  }, [designation]);

  // 2. Fetch stats and trends when filters change
  useEffect(() => {
    const fetchStatsAndTrends = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        
        // Fetch Stats
        const statsRes = await fetch(
          `${API_BASE_URL}api/dashboard/stats?facet=${progressFacet}&designation=${designation}&officer=${officer}`, 
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        // Fetch Trends
        const trendRes = await fetch(
          `${API_BASE_URL}api/dashboard/trend?facet=${progressFacet}&designation=${designation}&officer=${officer}`, 
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (trendRes.ok) {
          const trendJson = await trendRes.json();
          setTrendData(trendJson);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatsAndTrends();
  }, [progressFacet, designation, officer]);

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1a3a5c" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-[#0D4429] px-3 pb-4 pt-3 rounded-xl mx-4 mt-2">
          <View className="flex-row gap-1.5">
            <View className="flex-[1.15]">
              <CustomDropdownLabel label="Progress Facet">
                <CustomDropdown
                  options={PROGRESS_FACET_OPTIONS}
                  value={progressFacet}
                  onSelect={setProgressFacet}
                  placeholder="Select Progress Facet"
                />
              </CustomDropdownLabel>
            </View>

            <View className="flex-[0.92]">
              <CustomDropdownLabel label="Designation">
                <CustomDropdown
                  options={DESIGNATION_OPTIONS}
                  value={designation}
                  onSelect={setDesignation}
                  placeholder="Select Designation"
                />
              </CustomDropdownLabel>
            </View>

            <View className="flex-[0.92]">
              <CustomDropdownLabel label="Officer">
                <CustomDropdown
                  options={officerOptions}
                  value={officer}
                  onSelect={setOfficer}
                  placeholder="Select Officer"
                />
              </CustomDropdownLabel>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row px-4">
          <StatCard
            label="Total"
            value={String(stats.total)}
            color="#1a3a5c"
            iconName="bar-chart-outline"
            bgTint="#E8EEF5"
          />
          <StatCard
            label="Completed"
            value={String(stats.completed)}
            color="#15803d"
            iconName="checkmark-circle-outline"
            bgTint="#DCFCE7"
          />
          <StatCard
            label="In Process"
            value={String(stats.inProcess)}
            color="#1d4ed8"
            iconName="sync-outline"
            bgTint="#DBEAFE"
          />
          <StatCard
            label="Overdue"
            value={String(stats.overdue)}
            color="#b91c1c"
            iconName="alert-circle-outline"
            bgTint="#FEE2E2"
          />
        </View>

        <View className="mt-2 px-4">
          <FullscreenLandscapeCard
            title="Yearly trendline"
            renderChart={(w, h, opts) => (
              <YearlyTrendlineChart
                width={w}
                height={h}
                expanded={opts?.expanded === true}
                trendData={trendData}
              />
            )}
          />
        </View>

        <DirectivesSection />
      </ScrollView>
    </View>
  );
}
