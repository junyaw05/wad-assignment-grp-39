import React from 'react';
import { StyleSheet, Dimensions, View, Text, Alert, TouchableOpacity} from 'react-native';
import Pdf from 'react-native-pdf';

const PDFReaderScreen = ({ route, navigation }: any) => {
    const { pdfUrl, title } = route.params;
    const cleanUrl = pdfUrl ? pdfUrl.trim() : '';

    const source = { 
        uri: pdfUrl, 
        cache: true,
        headers: { 
            'Accept': 'application/pdf',
            'User-Agent': 'ReactNative' 
        } 
    };
    console.log("Attempting to load URL:", pdfUrl);

    return (
        <View style={styles.container}>
            <Pdf
                trustAllCerts={false} // Add this prop here too
                source={source}
                onLoadComplete={(numberOfPages) => console.log(`Pages: ${numberOfPages}`)}
                onError={(error) => {
                    console.log("PDF View Error:", error);
                    Alert.alert("Load Error", "The file could not be opened.");
                    navigation.goBack();
                }}
                style={styles.pdf}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        width: '100%',
        padding: 15,
        backgroundColor: '#0043fcff',
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
});

export default PDFReaderScreen;