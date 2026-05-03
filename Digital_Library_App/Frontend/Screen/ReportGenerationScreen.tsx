import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { styles } from '../SharedStyles';
import { RootStackParamList } from '../App';
import { PieChart } from 'react-native-chart-kit';

export type Props = StackScreenProps<RootStackParamList, 'ReportGeneration'>;

const API_BASE_URL = 'http://10.0.2.2:5000/api';

const ReportGenerationScreen = ({ navigation }: Props) => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalBooks: 0,
        activeBorrows: 0
    });
    const [loading, setLoading] = useState(true);
    const [genreData, setGenreData] = useState<any[]>([]);
    const [popularBooks, setPopularBooks] = useState<any[]>([]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const studentRes = await fetch(`${API_BASE_URL}/students`);
            const students = await studentRes.json();

            const bookRes = await fetch(`${API_BASE_URL}/books`);
            const books = await bookRes.json();

            const loanCountRes = await fetch(`${API_BASE_URL}/loans/active-loans-count`);
            const loanCountData = await loanCountRes.json();

            const leaderboardRes = await fetch(`${API_BASE_URL}/books/leaderboard`);
            const leaderboard = await leaderboardRes.json();

            const counts: { [key: string]: number } = {};
            books.forEach((b: any) => {
                const g = b.genre || 'Uncategorized';
                counts[g] = (counts[g] || 0) + 1;
            });

            const colors = ["#2B6CB0", "#805AD5", "#38A169", "#E53E3E", "#D69E2E", "#3182CE"];
            const formattedGenreData = Object.keys(counts).map((key, index) => ({
                name: key,
                population: counts[key],
                color: colors[index % colors.length],
                legendFontColor: "#4A5568",
                legendFontSize: 12
            }));

            setStats({
                totalStudents: students.length,
                totalBooks: books.length,
                activeBorrows: loanCountData.length,
            });
            setGenreData(formattedGenreData);
            setPopularBooks(leaderboard.slice(0, 5)); // Show top 5

        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#2B6CB0" />
                <Text style={{ textAlign: 'center', marginTop: 10 }}>Syncing Cloud Analytics...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.mainContainer}>
            <Text style={styles.header}>Library Insights</Text>

            {/* --- STATISTICS SUMMARY --- */}
            <View style={styles.reportCard}>
                <Text style={styles.cardTitle}>Cumulative Summary</Text>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Members</Text>
                    <Text style={styles.statValue1}>{stats.totalStudents}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Books in Catalog</Text>
                    <Text style={styles.statValue2}>{stats.totalBooks}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Books Currently Out</Text>
                    <Text style={styles.statValue3}>{stats.activeBorrows}</Text>
                </View>
            </View>

            {/* --- GENRE PIE CHART --- */}
            <View style={styles.reportPieCard}>
                <Text style={[styles.statLabel, { marginBottom: 15, fontWeight: 'bold' }]}>Genre Distribution</Text>
                {genreData.length > 0 ? (
                    <PieChart
                        data={genreData}
                        width={Dimensions.get('window').width - 40}
                        height={200}
                        chartConfig={{ color: () => `rgba(0, 0, 0, 1)` }}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute 
                    />
                ) : (
                    <Text style={{ textAlign: 'center', padding: 20 }}>No data available</Text>
                )}
            </View>

            {/* --- LEADERBOARD --- */}
            <View style={[styles.leaderboardCard, { marginBottom: 30 }]}>
                <Text style={styles.cardTitle}>Most Borrowed (All Time)</Text>
                {popularBooks.map((book, index) => (
                    <View key={book.id} style={styles.leaderboardRow}>
                        <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#ECC94B' : '#E2E8F0' }]}>
                            <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                            <Text style={styles.borrowSubtext}>{book.count} career borrows</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default ReportGenerationScreen;