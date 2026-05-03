import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewReader = ({ route }: any) => {
    const { url } = route.params;

    const combinedJS = `
      // 1. Setup Viewport for mobile scaling
      const meta = document.createElement('meta'); 
      meta.setAttribute('name', 'viewport'); 
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=10.0, user-scalable=yes'); 
      document.getElementsByTagName('head')[0].appendChild(meta);

      // 2. Apply Reading Mode Styles
      document.body.style.padding = '20px';
      document.body.style.lineHeight = '1.6';
      document.body.style.fontSize = '18px'; // Slightly larger for better mobile reading
      document.body.style.backgroundColor = '#ffffff';
      
      true; // Required for injectedJavaScript to execute correctly
    `;

    return (
        <View style={{ flex: 1 }}>
            <WebView 
                source={{ uri: url }} 
                setBuiltInZoomControls={true} 
                setDisplayZoomControls={false}
                scalesPageToFit={true}
                injectedJavaScript={combinedJS}
                startInLoadingState={true}
                renderLoading={() => (
                    <ActivityIndicator 
                        style={{ position: 'absolute', top: '50%', left: '45%' }} 
                        size="large" 
                        color="#0043fc" 
                    />
                )}
            />
        </View>
    );
};

export default WebViewReader;