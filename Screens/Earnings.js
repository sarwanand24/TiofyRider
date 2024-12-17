import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import Loading from "./Loading";

const Earnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderData, setRiderData] = useState({});
  const [activeTab, setActiveTab] = useState("daily");

  const parseWeekToDates = (isoWeek) => {
    const [year, week] = isoWeek.split("-W");
    const startDate = moment()
      .year(year)
      .week(week)
      .startOf("week")
      .format("MMM DD");
    const endDate = moment()
      .year(year)
      .week(week)
      .endOf("week")
      .format("MMM DD");
    return `${startDate} to ${endDate}`;
  };

  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        const rider = await AsyncStorage.getItem("Riderdata");
        if (rider) {
          setRiderData(JSON.parse(rider));
        } else {
          setError("No Rider data found in storage.");
        }
      } catch (err) {
        setError("Error fetching rider data.");
      }
    };

    fetchRiderData();
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (riderData._id) {
        try {
          setLoading(true);
          const response = await axios.get(
            "https://trioserver.onrender.com/api/v1/riders/earning-history",
            {
              params: { riderId: riderData._id },
            }
          );

          const transformedWeeklyData = response.data.earningsByWeek.map(
            (weekData) => ({
              ...weekData,
              dateRange: parseWeekToDates(weekData.week),
            })
          );

          setData({ ...response.data, earningsByWeek: transformedWeeklyData });
        } catch (err) {
          setError("Error fetching earnings history.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEarnings();
  }, [riderData._id]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "Error fetching data. Please try again."}
        </Text>
      </View>
    );
  }

  const renderWeeklyItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.date}>{item.dateRange}</Text>
      <Text style={styles.details}>Orders: {item.orders}</Text>
      <Text style={styles.details}>Earnings: ₹{item.totalEarnings.toFixed(2)}</Text>
    </View>
  );

  const renderDailyItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.date}>{item.date}</Text>
      <Text style={styles.details}>Orders: {item.orders}</Text>
      <Text style={styles.details}>Earnings: ₹{item.totalEarnings.toFixed(2)}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
             <StatusBar hidden={true} />
      <Text style={styles.title}>Earning History</Text>
      <Text style={styles.totalEarnings}>
        Total Earnings: ₹{data.totalEarnings.toFixed(2)}
      </Text>

      {/* Toggle Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "daily" && styles.activeTab]}
          onPress={() => setActiveTab("daily")}
        >
          <Text style={[styles.tabText, activeTab === "daily" && styles.activeTabText]}>
            Daily Earnings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "weekly" && styles.activeTab]}
          onPress={() => setActiveTab("weekly")}
        >
          <Text style={[styles.tabText, activeTab === "weekly" && styles.activeTabText]}>
            Weekly Earnings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering */}
      {activeTab === "daily" && (
        <FlatList
          data={data.earningsByDate}
          renderItem={renderDailyItem}
          keyExtractor={(item, index) => `date-${index}`}
          contentContainerStyle={styles.list}
        />
      )}
      {activeTab === "weekly" && (
        <FlatList
          data={data.earningsByWeek}
          renderItem={renderWeeklyItem}
          keyExtractor={(item, index) => `week-${index}`}
          contentContainerStyle={styles.list}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#68095F'
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: '#ffff00'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#555",
    marginBottom: 16,
  },
  totalEarnings: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "white",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#9f0d91",
  },
  tabText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  activeTabText: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    backgroundColor: "#9f0d91",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    color:'#ffff00'
  },
  details: {
    fontSize: 14,
    marginTop: 4,
    color: 'white'
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default Earnings;
