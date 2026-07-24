import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export const YEARLY_TREND_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const YEARLY_TREND_LABELS_FULL = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

const COLORS = {
  assigned: "#fb923c",
  completed: "#22c55e",
  overdue: "#ef4444",
  inProcess: "#38bdf8",
};

const SERIES_LABELS = ["Assigned", "Completed", "Overdue", "In process"];

function toData(values, labels) {
  return values.map((value, i) => ({
    value,
    label: labels[i] ?? "",
  }));
}

export default function YearlyTrendlineChart({ width, height, expanded = false, trendData }) {
  const [resetKey, setResetKey] = useState(0);

  const labels = expanded ? YEARLY_TREND_LABELS_FULL : YEARLY_TREND_LABELS;

  const series = trendData || {
    assigned: [18, 22, 20, 24, 26, 28, 30, 29, 31, 33, 35, 23],
    completed: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 0],
    overdue: [55, 58, 62, 68, 72, 78, 82, 88, 92, 98, 103, 103],
    inProcess: [5, 6, 5, 7, 6, 8, 7, 9, 8, 7, 7, 7]
  };

  const data = useMemo(() => toData(series.assigned, labels), [series.assigned, labels]);
  const data2 = useMemo(() => toData(series.completed, labels), [series.completed, labels]);
  const data3 = useMemo(() => toData(series.overdue, labels), [series.overdue, labels]);
  const data4 = useMemo(() => toData(series.inProcess, labels), [series.inProcess, labels]);

  if (!width || !height || width < 48 || height < 48) return null;

  const Y_GUTTER = 48;
  const initialSpacing = expanded ? 10 : 6;
  const endSpacing = expanded ? 16 : 10;
  const inner = Math.max(40, width - Y_GUTTER - initialSpacing - endSpacing - 8);
  const spacing = inner / Math.max(1, data.length - 1);

  const xFont = expanded ? 9 : 8;

  const legendHeight = 40;
  const chartHeight = Math.max(80, height - 75);

  const allValues = [...series.assigned, ...series.completed, ...series.overdue, ...series.inProcess];
  const maxVal = Math.max(...allValues, 10);
  const chartMax = Math.ceil(maxVal * 1.15);

  return (
    <View style={{ width, maxWidth: width, height, backgroundColor: "#fff", borderRadius: 12, paddingBottom: 6 }}>
      <LineChart
        key={resetKey}
        data={data}
        data2={data2}
        data3={data3}
        data4={data4}
        width={width}
        height={chartHeight}
        yAxisLabelWidth={Y_GUTTER}
        spacing={spacing}
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        thickness={2}
        curved
        hideDataPoints={false}
        dataPointsRadius={3.5}
        color={COLORS.assigned}
        color2={COLORS.completed}
        color3={COLORS.overdue}
        color4={COLORS.inProcess}
        dataPointsColor={COLORS.assigned}
        dataPointsColor2={COLORS.completed}
        dataPointsColor3={COLORS.overdue}
        dataPointsColor4={COLORS.inProcess}
        noOfSections={5}
        maxValue={chartMax}
        yAxisTextStyle={{ color: "#64748b", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#475569", fontSize: xFont, fontWeight: "600" }}
        rulesColor="#e5e7eb"
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        backgroundColor="#ffffff"
        scrollToEnd={expanded}
        pointerConfig={{
          pointerStripColor: "rgba(0,0,0,0.3)",
          pointerStripWidth: 1.5,
          pointerColor: "#111827",
          radius: 5,
          persistPointer: false,
          pointerVanishDuration: 3000,
          activatePointersOnLongPress: false,
          pointerLabelWidth: 145,
          pointerLabelHeight: 110,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items) => {
            const list = Array.isArray(items) ? items : [];
            return (
              <View
                style={{
                  backgroundColor: "#111827",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  elevation: 6,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                }}
              >
                {list.length === 0 ? (
                  <Text style={{ color: "#fff", fontSize: 11 }}>No data</Text>
                ) : (
                  list.map((it, idx) => (
                    <Text key={idx} style={{ color: it?.color ?? "#fff", fontSize: 11, fontWeight: "600", marginVertical: 1 }}>
                      {SERIES_LABELS[idx] ?? `Series ${idx + 1}`}: {it?.value ?? "0"}
                    </Text>
                  ))
                )}
              </View>
            );
          },
        }}
      />

      {/* Legend Container - Image 2 & 3 exact design */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 4, paddingBottom: 6, flexWrap: "wrap" }}>
        {/* Assigned */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginVertical: 2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.assigned, marginRight: 5 }} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#4B5563" }}>Assigned</Text>
        </View>

        {/* Completed */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginVertical: 2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.completed, marginRight: 5 }} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#4B5563" }}>Completed</Text>
        </View>

        {/* Overdue */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginVertical: 2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.overdue, marginRight: 5 }} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#4B5563" }}>Overdue</Text>
        </View>

        {/* In process */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginVertical: 2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.inProcess, marginRight: 5 }} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#4B5563" }}>In process</Text>
        </View>
      </View>
    </View>
  );
}
