import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    // --- Layout & Global Styles ---
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 5,
        paddingTop: 30,
        paddingBottom: 110, 
    },


    loginPageBG: {
        backgroundColor: '#F0F7FF',
    },


    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 5,
    },

    // --- Identity Elements ---
    logo: {
        width: 200,
        height: 200,
        borderRadius: 35,
        marginBottom: 20,
    },
    loginPageText: {
        color: '#1A202C',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
        letterSpacing: 0.5,
        fontFamily: 'sans-serif-medium',
    },

    // --- Form Inputs ---
    inputTextBox: {
        backgroundColor: '#f8f8ff',
        borderColor: '#949494',
        borderWidth: 1,
        borderRadius: 12,
        width: 320,
        height: 55,
        marginTop: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#2D3748',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    passwordTextBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8ff',
        borderColor: '#949494',
        borderWidth: 1,
        borderRadius: 12,
        width: 320,
        height: 55,
        marginTop: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        color: '#2D3748',
        fontSize: 16,
    },
    iconButton: {
        paddingRight: 15,
    },

    // --- Buttons & Links ---
    loginButton: {
        backgroundColor: '#0043fcff',
        borderRadius: 12,
        width: 200,
        height: 50,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    forgotPasswordText: {
        color: '#0043fcff',
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },

    // --- Form Validation Feedback ---
    criteriaContainer: {
        width: 310,
        marginTop: 10,
        alignItems: 'flex-start',
    },
    criteriaText: {
        fontSize: 13,
        marginBottom: 2,
    },
    criteriaValid: {
        color: '#2F855A', 
    },
    criteriaInvalid: {
        color: '#C53030', 
    },
    criteriaErrorText: {
        color: '#C53030',
        fontSize: 13,
        marginTop: 5,
    },

    // --- Library / Magazine Grid (New Designs) ---
    row: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        flex: 0.48, 
        backgroundColor: 'white',
        marginBottom: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },

    magazineCard: {
        flex: 0.48, 
        backgroundColor: 'white',
        marginBottom: 15,
        borderColor: 'grey',
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 5, 
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    coverPlaceholder: {
        height: 150,
        backgroundColor: '#EDF2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#A0AEC0',
    },
    infoContainer: {
        padding: 10,
        height: 100,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bookTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1A202C',
        flex: 1,
    },
    dots: {
        fontSize: 18,
        color: '#718096',
        marginTop: -4,
    },
    dateText: {
        fontSize: 11,
        color: '#718096',
        marginTop: 2,
    },
    categoryRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 10,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    borrowButton: {
        borderTopWidth: 1,
        borderTopColor: '#F7FAFC',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    borrowButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4A5568',
    },

    // --- Legacy / Misc Styles ---
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 18,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    textContainer: {
        flex: 1,
        marginRight: 20,
    },

    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#A0AEC0',
    },
    squareCard: {
        flex: 1,
        aspectRatio: 1,
        margin: 8,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 10,
    },
    contentCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgb(117, 149, 236)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        marginRight: 15,
    },
    iconText: {
        fontWeight: 'bold',
        color: '#F7FAFC',
    },
    squareTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2D3748',
    },
    bookAuthor: {
        fontSize: 15,
        color: 'black',
        fontStyle: 'italic',
        marginTop: 2,
    },

    // --- Library Screen Styles ---/
    searchBar: {
        backgroundColor: '#E2E8F0',
        borderRadius: 10,
        height: 50,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        color: '#2D3748',
    },

    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 10,
        paddingHorizontal: 10,
        height: 400,
    },

    podiumBookCard: {
        width: 90,
        height: 70,
        padding: 8,
        flexDirection: 'column',
        justifyContent: 'center',
        marginBottom: 5,
    },

    podiumBookTitle:{
        fontSize: 12,
        color: 'black',
        fontWeight: 'bold',
    },

    firstPodiumStage:{
        backgroundColor: '#FFD700',
        height: 130,
        width: 110,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    secondPodiumStage:{ 
        backgroundColor: '#C0C0C0',
        height: 110,
        width: 100,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    thirdPodiumStage:{
        backgroundColor: '#CD7F32',
        height: 90,
        width: 90,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    podiumColumn: {
        alignItems: 'center',
        width: '30%',
    },

    podiumRankText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.3)',
    },

    // --- Settings Screen Styles ---/
    settingcontainer:{
        flex: 1,
        marginTop: 15,
        marginLeft: 15,
        marginRight: 15,
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    
    optionCard: {
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    optionText: {
        fontSize: 16,
        color: '#1A202C',
    },

    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',

    },
    modalText: {
        fontSize: 18,
        marginBottom: 30,
        color: 'black',
        fontWeight: 'bold',
    },

    modalTextInput:{
        width: '100%',
        height: 50,
        borderColor: '#27262621',
        borderWidth: 3,
        borderRadius: 10,
        paddingHorizontal: 10,
    },

    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#474747',
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#1A202C',
    },
    confirmButton:{
        backgroundColor: '#414abe',
        borderColor: '#1518dd',
    },

    logoutOptionCard:{
        height: 50,
        width: '50%',
        marginTop: 100,
        backgroundColor: '#ff0000'
    },

    optionLogoutText:{
        textAlign: 'center',
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },

    logoutButton: {
        backgroundColor: '#C53030',
        borderColor: '#C53030',
    },

    // --- Admin HomeScreen Styles ---/
    AdminContainer:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 20,
        paddingTop: 30,
    },

    AdminMainButton:{
        backgroundColor: '#8a88fd',
        borderRadius: 12,
        width: 300,
        marginBottom: 20,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        borderColor: '#c1c1c1',
        borderWidth: 1,
    },

    AdminMainButton2:{
        backgroundColor: '#cd76ff',
    },

    AdminMainButton3:{
        backgroundColor: '#ff82ea',
    },

    AdminMainButton4:{
        backgroundColor: '#ff006a',
    },


    AdminMainButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },

    AdminMainButtonImage: {
        width: 40,
        height: 40,
        marginBottom: 5,
    },

    // --- Report Generation Screen Styles ---/

    reportCard: { 
        backgroundColor: 'white', 
        padding: 20, 
        borderRadius: 15, 
        marginTop: 20,
        marginBottom:10, 
        elevation: 4, 
    },

    reportPieCard: { 
        backgroundColor: '#ffffff', 
        padding: 20, 
        borderRadius: 15, 
        marginTop: 10,
        marginBottom:50, 
        elevation: 4, 
    },

    cardTitle: { 
        fontSize: 25, 
        fontWeight: 'bold', 
        color: '#000000' 
    },

    statCard: { 
        backgroundColor: '#d8e2f3',
        padding: 20, 
        borderRadius: 12, 
        marginTop: 15, 
        marginBottom: 10,
        alignItems: 'center',
        elevation: 4, 
    },

    statLabel: { 
        fontSize: 20, 
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 5,
    },

    statValue1: { 
        fontSize: 30, 
        fontWeight: 'bold', 
        color: 'blue' 
    },
    
    statValue2: { 
        fontSize: 30, 
        fontWeight: 'bold', 
        color: '#5da0ff' 
    },

    
    statValue3: { 
        fontSize: 30, 
        fontWeight: 'bold', 
        color: '#059669' 
    },


    sectionTitle: { 
        fontSize: 14, 
        color: 'black',
        fontWeight: 'bold',
        alignSelf: 'flex-start', 
        marginBottom: 10
    },

    pickerContainer: {
        backgroundColor: 'white', 
        width: '40%',
        borderRadius: 12, 
        left: 10,
        marginTop: 10,
        marginBottom: 5, 
        marginRight: 20,
        borderWidth: 1, 
        borderColor: '#acd0ff',
        overflow: 'hidden'
    },

    pickerContainer2: {
        backgroundColor: 'white', 
        width: '50%',
        borderRadius: 12, 
        left: 10,
        marginTop: 10,
        marginBottom: 5, 
        marginRight: 20,
        borderWidth: 1, 
        borderColor: '#acd0ff',
        overflow: 'hidden'
    },

    // --- Testing Part ---/
    leaderboardCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
    },

    AdminSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 15,
    },
    
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC',
    },

    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    rankText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#2D3748',
    },

    AdminBookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    
    borrowSubtext: {
        fontSize: 12,
        color: '#718096',
    },

    pickersRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // --- Student Management Screen Styles ---/
    cancelButton: {
        backgroundColor: '#adadad',
        borderRadius: 12,
        width: 150,
        height: 50,
        marginTop: 20,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
    },

    addStudentButton: {
        backgroundColor: '#0043fcff',
        borderRadius: 12,
        width: 150,
        height: 50,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
    },

    adminLogoutButton: {
        backgroundColor: '#C53030',
        borderRadius: 12,
        width: 150,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
    },

    adminLogoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    adminFooter: {
        alignItems: 'center',
    },


    // --- Book Modal Styles(Latest) ---
    bookModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        height: '85%',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    closeButton: {
        position: 'absolute',
        top:10,
        right:10,
        zIndex:10,
        elevation: 10,
        padding: 5,
    },

    modalCloseImage: {
        width: 30,
        height: 30,
        tintColor: '#4A5568',
        resizeMode: 'contain',
    },
    
    modalImage: {
        width: 130,
        height: 180,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
    },
    modalGenre: {
        color: '#b800ffff',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 5,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A202C',
        lineHeight: 32,
    },
    modalAuthor: {
        fontSize: 18,
        color: '#718096',
        marginTop: 5,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    modalDescriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 10,
    },
    modalDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4A5568',
        textAlign: 'justify',
        paddingBottom: 20,
    },
    BookBorrowButton: {
        backgroundColor: 'rgb(202, 92, 245)',
        borderRadius: 15,
        height: 55,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 30,
        elevation: 5,
    },
    BookBorrowButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },

    BookModalContent: {
        width: '85%',
        height: '65%',
        backgroundColor: 'white',
        borderRadius: 20, 
        padding: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    BookModalContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    BookTextContainer: {
        paddingHorizontal: 20, 
        alignItems: 'flex-start', 
        width: '100%', 
    },
    BookModalDescription: {
        fontSize: 14,
        color: '#4A5568',
        textAlign: 'left', 
        alignSelf: 'stretch', 
        lineHeight: 20, 
        marginTop: 8,
    },

    deleteButton:{
        backgroundColor: '#C53030', 
        borderRadius: 12,
        width: 150,
        height: 50,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
    },
    wishlistIconContainer: {
        position: 'absolute',
        bottom: 15, 
        right: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        padding: 8,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
})