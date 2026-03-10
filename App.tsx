import html2canvas from 'html2canvas';
import { generateVisionPDF } from './generateVisionPDF';
import React, { useState, useEffect, useRef } from 'react';
import { DiscernmentState, Message, VisionDocument, VisionSession, AppView, CreditCard } from './types';
import { getNextDiscernmentStep, generateSynthesis } from './geminiService';
import { supabase, signUpWithProfile, createVisionInDB, updateVisionChatSession, ensureUserProfile, signInWithGoogle } from './supabase';
import VisionUnlock from './VisionUnlock';

type Language = 'en' | 'es' | 'fr' | 'pt' | 'it' | 'de' | 'nl' | 'ar' | 'ru' | 'zh' | 'hi' | 'bn' | 'ja' | 'ko' | 'sw' | 'tr' | 'id';

const translations: Record<Language, any> = {
  en: {
    login: "LOG IN", signup: "SIGN UP", emailLabel: "Email", passwordLabel: "Password", nameLabel: "Name",
    newVision: "NEW VISION", library: "LIBRARY", profile: "Profile", logout: "SIGN OUT", 
    reflecting: "Reflecting...", generateVision: "CREATE VISION DOCUMENT",
    download: "SAVE AS IMAGE", clearVision: "A CLEAR VISION.", beginJourney: "START HERE",
    tagline: "A simple way to find clarity and plan your next steps using The Word of God.",
    visions: "Your Visions", noVisions: "NO VISIONS FOUND.", backToLogin: "BACK TO LOGIN", createAccount: "CREATE ACCOUNT",
    reflectHere: "Share your thoughts...", readyForSynthesis: "ready for generation",
    finalizePrompt: "You have found clarity. Would you like to create your vision document now?",
    errorGeneric: "Something went wrong. Please check your connection and try again.",
    errorAuth: "The email or password you entered is incorrect.",
    errorDuplicate: "An account with this email already exists. Please log in instead.",
    errorNotFound: "No account was found with this email address.",
    progressLabel: "PROGRESS",
    accountInfo: "ACCOUNT DETAILS",
    save: "SAVE CARD",
    back: "Back",
    currencyLabel: "Preferred Currency",
    continueGoogle: "Continue with Google",
    truthTagline: "TRUTH MATTERS MORE THAN POLISHED WORDS.",
    enter: "ENTER",
    sendResetLink: "SEND RESET LINK",
    forgotPassword: "FORGOT PASSWORD?",
    countSuffix: "VISIONS",
    profileSaveError: "We couldn’t save your profile right now. Please try again.",
    profileSaveSuccess: "Your profile has been updated.",
    open: "Open",
    paywallTitle: "Unlock Your Vision",
    paywallTitleUnlocked: "Vision Unlocked",
    paywallDesc: "A small contribution to keep Hazon running and support your journey.",
    paywallPrice: "$3.00",
    paywallAction: "Unlock Vision",
    preparingPayment: "Preparing secure payment...",
    generatingTitle: "Generating your vision...",
    generatingDesc: "Hazon is synthesizing your reflections into a biblical alignment document. This will only take a moment.",
    confSignupTitle: "Check Your Inbox",
    confSignupDesc: "Your account has been created. Check your email to confirm your account and begin your first journey to clarity.",
    confForgotTitle: "Check Your Inbox",
    confForgotDesc: "If an account exists, we've sent a recovery link. Follow the instructions in the email to reset your password.",
    notFoundTitle: "404 - Vision Not Found",
    notFoundDesc: "The path you are seeking does not exist or this vision has moved.",
    returnLibrary: "RETURN TO LIBRARY",
    drafts: "Drafts",
    completed: "Completed",
    retry: "RETRY",
    errorFetch: "Connection failed. Please check your internet or try again later.",
    paymentCancelled: "Payment was not completed. Your vision is still locked.",
    verificationFailed: "Payment could not be verified. Please try again.",
    initPaymentFailed: "We couldn't initialize your payment. Please try again.",
    verifyingPayment: "Verifying your payment...",
    paymentSettings: "Payment Methods",
    addCard: "Add New Card",
    cardName: "Cardholder Name",
    cardNumber: "Card Number",
    expiryDate: "Expiry Date (MM/YY)",
    cvv: "CVV",
    remove: "Remove",
    noCards: "No saved cards.",
    stopMic: "STOP",
    listening: "Listening...",
    aboutTitle: "ABOUT HAZON",
    aboutSubtitle1: "Hazon is a biblical discernment companion.",
    aboutPara1Sub: "Clarity is not discovered through instinct or pressure. It is revealed when our thinking aligns with God’s wisdom.",
    aboutSubtitle2: "A Companion for Discernment",
    aboutPara2Sub: "Hazon walks with you as you seek direction for your life, work, calling, or ministry, slowing the moment, asking the right questions, and grounding every step in Scripture.",
    aboutSubtitle3: "Guided by Scripture, Not Noise",
    aboutPara3Sub: "In a world full of opinions and urgency, Hazon helps bring order to your thoughts and peace to your decisions by anchoring them in biblical truth.",
    aboutSubtitle4: "For Seekers and Believers Alike",
    aboutPara4Sub: "Whether you are following Christ or searching for truth, Hazon is an invitation to wisdom that endures, guidance that does not waver, and clarity that comes from above.",
    aboutScripture1: "Where there is no vision, the people perish. — Proverbs 29:18",
    aboutScripture2: "Write the vision, and make it plain... that he may run that readeth it. — Habakkuk 2:2",
    aboutBlackBoxTitle: "Clarity Through the Word of God",
    aboutBlackBoxText: "True clarity is not discovered by striving harder, but by listening more closely to the Spirit of Truth. Scripture teaches that vision is not formed by impulse, but revealed through God’s wisdom.\n\nProverbs 29:18 tells us, “Where there is no vision, the people perish.” God’s Word makes it clear: without kingdom aligned vision, direction is lost and purpose fades. Vision is not optional, it is essential for a life aligned with Him.\n\nLikewise, Proverbs 3:5–6 instructs us, “Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make straight your paths.” True direction begins when we release our own certainty and submit our plans to God’s leading.\n\nHazon exists to quiet the noise, anchor discernment in Scripture, and help you receive vision that is clear, God-centered, and meant to be lived out with faith and wisdom.",
    howItWorksTitle: "HOW IT WORKS",
    step1: "Reflect",
    step1Desc: "Pause and speak honestly about what’s on your heart in a guided, thoughtful conversation.",
    step2: "Discern",
    step2Desc: "Gain clarity as your thoughts are gently shaped and aligned with timeless biblical wisdom.",
    step3: "Visualize",
    step3Desc: "Receive a clear, beautifully crafted vision that helps you move forward with confidence and peace.",
    getStartedTitle: "Ready to find clarity?",
    getStartedDesc: "True clarity begins when you stop striving for answers and start seeking wisdom. Hazon guides you through Scripture-led reflection to help you discern your next steps with confidence and peace. Begin your journey and let God’s Word bring light to what comes next.",
    getStartedButton: "BEGIN MY JOURNEY",
    evangelismTitle: "NOT A CHRISTIAN? START HERE.",
    evangelismPhilosophy: "Hazon Philosophy",
    evangelismPrayerSubtitle: "A Prayer to receive Christ",
    evangelismDesc: "Hazon is grounded in the truth that Jesus Christ is the Way, the Truth, and the Life. You are welcome to seek wisdom, direction, and peace here, but the greatest clarity any person can receive is the assurance of salvation found in Jesus Christ alone. No vision, plan, or purpose can stand firm without first being anchored in Christ.",
    evangelismSub: "You can receive this regardless of your sins, He can forgive them all. If your heart is stirring and you desire to begin a better life with God, you may pray this prayer, not as a ritual, but as a sincere step of faith.",
    evangelismPrayerTitle: "A Prayer of Faith",
    evangelismPrayer: "Heavenly Father,\nI acknowledge that I have lived apart from You and fallen short of Your will.\nI believe that Jesus Christ died for my sins and rose again so that I may have new life.\nToday, I place my trust in Him and receive Him as my Lord and Saviour.\nLead me in Your truth, guide my steps, and fill me with Your peace.\nThank you for forgiving my sins through Jesus Christ.\nAmen.",
    savedByGrace: "You are now saved by grace through faith in Jesus Christ, not by your works.",
    copyright: "Hazon | A Clear Vision",
    language: "Language",
    supportHazon: "Support Hazon",
    improvementSuggestions: "Improvement Suggestions",
    contribute: "Contribute",
    supportDesc: "Your support helps us keep Hazon running, allowing us to help seekers and believers worldwide. Every contribution is an investment in the mission of bringing God-centered clarity to those seeking direction.",
    amount: "AMOUNT",
    minContribution: "Please enter a contribution of $1 or more."
  },
  es: {
    login: "INICIAR SESIÓN", signup: "REGISTRARSE", emailLabel: "Email", passwordLabel: "Contraseña", nameLabel: "Nombre",
    newVision: "NUEVA VISIÓN", library: "BIBLIOTECA", profile: "Perfil", logout: "CERRAR SESIÓN", 
    reflecting: "Reflexionando...", generateVision: "CREAR DOCUMENTO",
    download: "GUARDAR IMAGEN", clearVision: "UNA VISIÓN CLARA.", beginJourney: "EMPEZAR AQUÍ",
    tagline: "Una forma sencilla de encontrar claridad utilizando la Palabra de Dios.",
    visions: "Tus Visiones", noVisions: "NO SE ENCONTRARON.", backToLogin: "VOLVER", createAccount: "CREAR CUENTA",
    reflectHere: "Comparte tus pensamientos...", readyForSynthesis: "listo para la generación",
    finalizePrompt: "¿Te gustaría crear tu documento de visión ahora?",
    errorGeneric: "Algo salió mal.",
    errorAuth: "Email o contraseña incorrectos.",
    errorDuplicate: "La cuenta ya existe.",
    errorNotFound: "No se encontró la cuenta.",
    progressLabel: "PROGRESO",
    accountInfo: "DETALLES",
    save: "GUARDAR",
    back: "Atrás",
    currencyLabel: "Moneda",
    continueGoogle: "Continuar con Google",
    truthTagline: "LA VERDAD IMPORTA MÁS QUE LAS PALABRAS.",
    enter: "ENTRAR",
    sendResetLink: "ENVIAR ENLACE",
    forgotPassword: "¿OLVIDASTE TU CONTRASEÑA?",
    countSuffix: "VISIONES",
    profileSaveError: "No se pudo guardar.",
    profileSaveSuccess: "Perfil actualizado.",
    open: "Abrir",
    paywallTitle: "Desbloquea tu Visión",
    paywallTitleUnlocked: "Visión Desbloqueada",
    paywallDesc: "Una pequeña contribución para apoyar tu viaje.",
    paywallPrice: "$3.00",
    paywallAction: "Desbloquear",
    preparingPayment: "Preparando pago...",
    generatingTitle: "Generando...",
    generatingDesc: "Hazon está sintetizando tus reflexiones.",
    confSignupTitle: "Revisa tu inbox",
    confSignupDesc: "Cuenta creada.",
    confForgotTitle: "Revisa tu inbox",
    confForgotDesc: "Enlace enviado.",
    notFoundTitle: "404",
    notFoundDesc: "No encontrado.",
    returnLibrary: "VOLVER A BIBLIOTECA",
    drafts: "Borradores",
    completed: "Completados",
    retry: "REINTENTAR",
    errorFetch: "Error de conexión.",
    paymentCancelled: "Pago cancelado.",
    verificationFailed: "Error de verificación.",
    initPaymentFailed: "Error al iniciar.",
    verifyingPayment: "Verificando...",
    paymentSettings: "Métodos de Pago",
    addCard: "Añadir Tarjeta",
    cardName: "Nombre",
    cardNumber: "Número",
    expiryDate: "Expiración",
    cvv: "CVV",
    remove: "Eliminar",
    noCards: "Sin tarjetas.",
    stopMic: "STOP",
    listening: "Escuchando...",
    aboutTitle: "SOBRE HAZON",
    aboutSubtitle1: "Hazon es un compañero de discernimiento bíblico.",
    aboutPara1Sub: "La claridad se revela cuando nuestro pensamiento se alinea con la sabiduría de Dios.",
    aboutSubtitle2: "Un Compañero de Discernimiento",
    aboutPara2Sub: "Hazon camina contigo mientras buscas dirección.",
    aboutSubtitle3: "Guiado por las Escrituras",
    aboutPara3Sub: "Hazon ayuda a traer orden a tus pensamientos.",
    aboutSubtitle4: "Para Todos",
    aboutPara4Sub: "Hazon es una invitación a la sabiduría.",
    aboutScripture1: "Donde no hay visión, el pueblo perece. — Proverbios 29:18",
    aboutScripture2: "Escribe la visión... para que corra el que la leyere. — Habacuc 2:2",
    howItWorksTitle: "CÓMO FUNCIONA",
    step1: "Reflejar",
    step1Desc: "Habla honestamente sobre lo que hay en tu corazón.",
    step2: "Discernir",
    step2Desc: "Gana claridad con sabiduría bíblica.",
    step3: "Visualizar",
    step3Desc: "Recibe una visión clara.",
    getStartedTitle: "¿LISTO PARA LA CLARIDAD?",
    getStartedButton: "EMPEZAR VIAJE",
    evangelismTitle: "¿NO ERES CRISTIANO? EMPIEZA AQUÍ.",
    evangelismPhilosophy: "Filosofía Hazon",
    evangelismPrayerSubtitle: "Una oración para recibir a Cristo",
    evangelismDesc: "Hazon se basa en la verdad de que Jesucristo es el Camino.",
    evangelismSub: "Puedes recibir esto sin importar tus pecados.",
    evangelismPrayerTitle: "Oración de Fe",
    evangelismPrayer: "Padre Celestial,\nReconozco que he vivido apartado de Ti...",
    savedByGrace: "Ahora eres salvo por gracia mediante la fe en Jesucristo.",
    copyright: "Una Visión Clara",
    language: "Idioma",
    supportHazon: "Apoyar a Hazon",
    improvementSuggestions: "Sugerencias de mejora",
    contribute: "Contribuir",
    supportDesc: "Tu apoyo nos ayuda a mantener Hazon en funcionamiento, permitiéndonos ayudar a buscadores y creyentes en todo el mundo. Cada contribución es una inversión en la misión de brindar claridad centrada en Dios a quienes buscan dirección.",
    amount: "CANTIDAD",
    minContribution: "Por favor, ingresa una contribución de $1 o más."
  },
  fr: {
    login: "CONNEXION", signup: "S'INSCRIRE", emailLabel: "Email", passwordLabel: "Mot de passe", nameLabel: "Nom",
    newVision: "NOUVELLE VISION", library: "BIBLIOTHÈQUE", profile: "Profil", logout: "DÉCONNEXION", 
    reflecting: "Réflexion...", generateVision: "CRÉER UN DOCUMENT",
    download: "SAUVEGARDER L'IMAGE", clearVision: "UNE VISION CLAIRE.", beginJourney: "COMMENCER ICI",
    tagline: "Un moyen simple de trouver la clarté grâce à la Parole de Dieu.",
    visions: "Vos Visions", noVisions: "AUCUNE VISION.", backToLogin: "RETOUR", createAccount: "CRÉER COMPTE",
    reflectHere: "Partagez vos pensées...", readyForSynthesis: "prêt pour la génération",
    finalizePrompt: "Souhaitez-vous créer votre document de vision maintenant ?",
    errorGeneric: "Une erreur est survenue.",
    errorAuth: "Email ou mot de passe incorrect.",
    errorDuplicate: "Ce compte existe déjà.",
    errorNotFound: "Compte introuvable.",
    progressLabel: "PROGRESSION",
    accountInfo: "DÉTAILS DU COMPTE",
    save: "SAUVEGARDER",
    back: "Retour",
    currencyLabel: "Devise",
    continueGoogle: "Continuer avec Google",
    truthTagline: "LA VÉRITÉ IMPORTE PLUS QUE LES MOTS.",
    enter: "ENTRER",
    sendResetLink: "ENVOYER LIEN",
    forgotPassword: "MOT DE PASSE OUBLIÉ ?",
    countSuffix: "VISIONS",
    profileSaveError: "Erreur de sauvegarde.",
    profileSaveSuccess: "Profil mis à jour.",
    open: "Ouvrir",
    paywallTitle: "Débloquez votre Vision",
    paywallTitleUnlocked: "Vision Débloquée",
    paywallDesc: "Une petite contribution pour soutenir Hazon.",
    paywallPrice: "$3.00",
    paywallAction: "Débloquer",
    preparingPayment: "Préparation du paiement...",
    generatingTitle: "Génération...",
    generatingDesc: "Hazon synthétise vos réflexions.",
    confSignupTitle: "Vérifiez votre boîte",
    confSignupDesc: "Compte créé.",
    confForgotTitle: "Vérifiez votre boîte",
    confForgotDesc: "Lien envoyé.",
    notFoundTitle: "404",
    notFoundDesc: "Non trouvé.",
    returnLibrary: "RETOUR BIBLIOTHÈQUE",
    drafts: "Brouillons",
    completed: "Terminés",
    retry: "RÉESSAYER",
    errorFetch: "Échec de connexion.",
    paymentCancelled: "Paiement annulé.",
    verificationFailed: "Échec vérification.",
    initPaymentFailed: "Échec initiation.",
    verifyingPayment: "Vérification...",
    paymentSettings: "Paiements",
    addCard: "Ajouter carte",
    cardName: "Nom",
    cardNumber: "Numéro",
    expiryDate: "Expiration",
    cvv: "CVV",
    remove: "Supprimer",
    noCards: "Aucune carte.",
    stopMic: "STOP",
    listening: "Écoute...",
    aboutTitle: "À PROPOS DE HAZON",
    aboutSubtitle1: "Hazon est un compagnon de discernement biblique.",
    aboutPara1Sub: "La clarté se révèle quand notre pensée s'aligne sur la sagesse de Dieu.",
    aboutSubtitle2: "Un Compagnon de Discernement",
    aboutPara2Sub: "Hazon marche avec vous.",
    aboutSubtitle3: "Guidé par l'Écriture",
    aboutPara3Sub: "Hazon aide à mettre de l'ordre dans vos pensées.",
    aboutSubtitle4: "Pour Tous",
    aboutPara4Sub: "Hazon est une invitation à la sagesse.",
    aboutScripture1: "Là où il n'y a pas de vision, le peuple périt. — Proverbes 29:18",
    aboutScripture2: "Écris la vision... pour que celui qui la lit puisse courir. — Habacuc 2:2",
    howItWorksTitle: "COMMENT ÇA MARCHE",
    step1: "Réfléchir",
    step1Desc: "Parlez honnêtement de ce qui est sur votre cœur.",
    step2: "Discerner",
    step2Desc: "Gagnez en clarté grâce à la sagesse biblique.",
    step3: "Visualiser",
    step3Desc: "Recevez une vision claire.",
    getStartedTitle: "PRÊT POUR LA CLARTÉ ?",
    getStartedButton: "COMMENCER LE VOYAGE",
    evangelismTitle: "PAS CHRÉTIEN ? COMMENCEZ ICI.",
    evangelismPhilosophy: "Philosophie Hazon",
    evangelismPrayerSubtitle: "Une prière pour recevoir le Christ",
    evangelismDesc: "Hazon est fondé sur la vérité que Jésus-Christ est le Chemin.",
    evangelismSub: "Vous pouvez recevoir cela quels que soient vos péchés.",
    evangelismPrayerTitle: "Prière de Foi",
    evangelismPrayer: "Père Céleste,\nJe reconnais avoir vécu loin de Toi...",
    savedByGrace: "Vous êtes maintenant sauvé par la grâce par la foi en Jésus-Christ.",
    copyright: "Une Visión Claire",
    language: "Langue",
    supportHazon: "Soutenir Hazon",
    improvementSuggestions: "Suggestions d'amélioration",
    contribute: "Contribuer",
    supportDesc: "Votre soutien nous aide à faire fonctionner Hazon, nous permettant d'aider les chercheurs et les croyants du monde entier. Chaque contribution est un investissement dans la mission d'apporter une clarté centrée sur Dieu à ceux qui cherchent une direction.",
    amount: "MONTANT",
    minContribution: "Veuillez entrer une contribution de 1 $ ou plus."
  },
  pt: {
    login: "ENTRAR", signup: "CADASTRAR", emailLabel: "E-mail", passwordLabel: "Senha", nameLabel: "Nome",
    newVision: "NOVA VISÃO", library: "BIBLIOTECA", profile: "Perfil", logout: "SAIR", 
    reflecting: "Refletindo...", generateVision: "CRIAR DOCUMENTO",
    download: "SALVAR IMAGEM", clearVision: "UMA VISÃO CLARA.", beginJourney: "COMEÇAR AQUI",
    tagline: "Uma forma simples de encontrar clareza usando a Palavra de Deus.",
    visions: "Suas Visões", noVisions: "NENHUMA VISÃO ENCONTRADA.", backToLogin: "VOLTAR", createAccount: "CRIAR CONTA",
    reflectHere: "Compartilhe seus pensamentos...", readyForSynthesis: "pronto para geração",
    finalizePrompt: "Deseja criar seu documento de visão agora?",
    errorGeneric: "Algo deu errado.",
    errorAuth: "E-mail ou senha incorretos.",
    errorDuplicate: "Conta já existe.",
    errorNotFound: "Conta não encontrada.",
    progressLabel: "PROGRESSO",
    accountInfo: "DETALHES DA CONTA",
    save: "SALVAR",
    back: "Voltar",
    currencyLabel: "Moeda",
    continueGoogle: "Continuar com Google",
    truthTagline: "A VERDADE IMPORTA MAIS QUE PALAVRAS POLIDAS.",
    enter: "ENTRAR",
    sendResetLink: "ENVIAR LINK",
    forgotPassword: "ESQUECEU A SENHA?",
    countSuffix: "VISÕES",
    profileSaveError: "Erro ao salvar.",
    profileSaveSuccess: "Perfil atualizado.",
    open: "Abrir",
    paywallTitle: "Desbloqueie sua Visão",
    paywallTitleUnlocked: "Visão Desbloqueada",
    paywallDesc: "Uma pequena contribuição para apoiar sua jornada.",
    paywallPrice: "$3.00",
    paywallAction: "Desbloquear",
    preparingPayment: "Preparando pagamento...",
    generatingTitle: "Gerando...",
    generatingDesc: "Hazon está sintetizando suas reflexões.",
    confSignupTitle: "Verifique sua caixa de entrada",
    confSignupDesc: "Conta criada.",
    confForgotTitle: "Verifique sua caixa de entrada",
    confForgotDesc: "Link enviado.",
    notFoundTitle: "404",
    notFoundDesc: "Não encontrado.",
    returnLibrary: "VOLTAR PARA BIBLIOTECA",
    drafts: "Rascunhos",
    completed: "Concluídos",
    retry: "RECOMENTAR",
    errorFetch: "Erro de conexão.",
    paymentCancelled: "Pagamento cancelado.",
    verificationFailed: "Erro de verificação.",
    initPaymentFailed: "Erro ao iniciar.",
    verifyingPayment: "Verificando...",
    paymentSettings: "Métodos de Pagamento",
    addCard: "Adicionar Cartão",
    cardName: "Nome",
    cardNumber: "Número",
    expiryDate: "Expiração",
    cvv: "CVV",
    remove: "Remover",
    noCards: "Sem cartões.",
    stopMic: "PARAR",
    listening: "Ouvindo...",
    aboutTitle: "SOBRE HAZON",
    aboutSubtitle1: "Hazon é um companheiro de discernimento bíblico.",
    aboutPara1Sub: "A clareza é revelada quando nosso pensamento se alinha com a sabedoria de Deus.",
    aboutSubtitle2: "Um Companheiro para o Discernimento",
    aboutPara2Sub: "Hazon caminha com você enquanto busca direção.",
    aboutSubtitle3: "Guiado pelas Escrituras",
    aboutPara3Sub: "Hazon ajuda a trazer ordem aos seus pensamentos.",
    aboutSubtitle4: "Para Todos",
    aboutPara4Sub: "Hazon é um convite à sabedoria.",
    aboutScripture1: "Onde não há visão, o povo perece. — Provérbios 29:18",
    aboutScripture2: "Escreve a visão... para que possa correr quem a ler. — Habacuque 2:2",
    howItWorksTitle: "COMO FUNCIONA",
    step1: "Refletir",
    step1Desc: "Fale honestamente sobre o que está em seu coração.",
    step2: "Discernir",
    step2Desc: "Ganhe clareza com sabedoria bíblica.",
    step3: "Visualizar",
    step3Desc: "Receba uma visão clara.",
    getStartedTitle: "PRONTO PARA A CLAREZA?",
    getStartedButton: "COMEÇAR JORNADA",
    evangelismTitle: "NÃO É CRISTÃO? COMECE AQUI.",
    evangelismPhilosophy: "Filosofia Hazon",
    evangelismPrayerSubtitle: "Uma oração para receber a Cristo",
    evangelismDesc: "Hazon baseia-se na verdade de que Jesus Cristo é o Caminho.",
    evangelismSub: "Você pode receber isso independentemente dos seus pecados.",
    evangelismPrayerTitle: "Oração de Fé",
    evangelismPrayer: "Pai Celestial,\nReconheço que vivi longe de Ti...",
    savedByGrace: "Agora você é salvo pela graça através da fé em Jesus Cristo.",
    copyright: "Uma Visão Clara",
    language: "Idioma",
    supportHazon: "Apoiar Hazon",
    improvementSuggestions: "Sugestões de Melhoria",
    contribute: "Contribuir",
    supportDesc: "Seu apoio nos ajuda a manter o Hazon funcionando, permitindo-nos ajudar buscadores e crentes em todo o mundo. Cada contribuição é um investimento na missão de trazer clareza centrada em Deus para aqueles que buscam direção.",
    amount: "QUANTIA",
    minContribution: "Por favor, insira uma contribuição de $1 ou mais."
  },
  it: {
    login: "ACCEDI", signup: "REGISTRATI", emailLabel: "Email", passwordLabel: "Password", nameLabel: "Nome",
    newVision: "NUOVA VISIONE", library: "LIBRERIA", profile: "Profilo", logout: "ESCI", 
    reflecting: "Riflettendo...", generateVision: "CREA DOCUMENTO",
    download: "SALVA IMMAGINE", clearVision: "UNA VISIONE CHIARA.", beginJourney: "INIZIA QUI",
    tagline: "Un modo semplice per trovare chiarezza usando la Parola di Dio.",
    visions: "Le tue Visioni", noVisions: "NESSUNA VISIONE TROVATA.", backToLogin: "TORNA INDIETRO", createAccount: "CREA ACCOUNT",
    reflectHere: "Condividi i tuoi pensieri...", readyForSynthesis: "pronto per la generazione",
    finalizePrompt: "Vuoi creare il tuo documento di visione ora?",
    errorGeneric: "Qualcosa è andato storto.",
    errorAuth: "Email o password errate.",
    errorDuplicate: "Account già esistente.",
    errorNotFound: "Account non trovato.",
    progressLabel: "PROGRESSO",
    accountInfo: "DETTAGLI ACCOUNT",
    save: "SALVA",
    back: "Indietro",
    currencyLabel: "Valuta",
    continueGoogle: "Continua con Google",
    truthTagline: "LA VERITÀ CONTA PIÙ DELLE PAROLE LUCIDE.",
    enter: "ENTRA",
    sendResetLink: "INVIA LINK",
    forgotPassword: "PASSWORD DIMENTICATA?",
    countSuffix: "VISIONI",
    profileSaveError: "Errore nel salvataggio.",
    profileSaveSuccess: "Profilo aggiornato.",
    open: "Apri",
    paywallTitle: "Sblocca la tua Visione",
    paywallTitleUnlocked: "Visione Sbloccata",
    paywallDesc: "Un piccolo contributo per sostenere il tuo viaggio.",
    paywallPrice: "$3.00",
    paywallAction: "Sblocca",
    preparingPayment: "Preparazione pagamento...",
    generatingTitle: "Generazione...",
    generatingDesc: "Hazon sta sintetizzando le tue riflessioni.",
    confSignupTitle: "Controlla la tua posta",
    confSignupDesc: "Account creato.",
    confForgotTitle: "Controlla la tua posta",
    confForgotDesc: "Link inviato.",
    notFoundTitle: "404",
    notFoundDesc: "Non trovato.",
    returnLibrary: "TORNA ALLA LIBRERIA",
    drafts: "Bozze" ,
    completed: "Completati",
    retry: "RIPROVA",
    errorFetch: "Errore di connessione.",
    paymentCancelled: "Pagamento annullato.",
    verificationFailed: "Errore di verifica.",
    initPaymentFailed: "Errore di avvio.",
    verifyingPayment: "Verifica...",
    paymentSettings: "Metodi di Pagamento",
    addCard: "Aggiungi Carta",
    cardName: "Nome",
    cardNumber: "Numero",
    expiryDate: "Scadenza",
    cvv: "CVV",
    remove: "Rimuovi",
    noCards: "Nessuna carta.",
    stopMic: "STOP",
    listening: "In ascolto...",
    aboutTitle: "SU HAZON",
    aboutSubtitle1: "Hazon è un compagno di discernimento biblico.",
    aboutPara1Sub: "La chiarezza si rivela quando il nostro pensiero si allinea con la sapienza di Dio.",
    aboutSubtitle2: "Un Compagno per il Discernimento",
    aboutPara2Sub: "Hazon cammina con te mentre cerchi direzione.",
    aboutSubtitle3: "Guidato dalle Scritture",
    aboutPara3Sub: "Hazon aiuta a mettere ordine nei tuoi pensieri.",
    aboutSubtitle4: "Per Tutti",
    aboutPara4Sub: "Hazon è un invito alla sapienza.",
    aboutScripture1: "Dove non c'è visione, il popolo perisce. — Proverbi 29:18",
    aboutScripture2: "Scrivi la visione... perché chi la legge possa correre. — Abacuc 2:2",
    howItWorksTitle: "COME FUNZIONA",
    step1: "Riflettere",
    step1Desc: "Parla onestamente di ciò che hai nel cuore.",
    step2: "Discernere",
    step2Desc: "Ottieni chiarezza con la sapienza biblica.",
    step3: "Visualizzare",
    step3Desc: "Ricevi una visione chiara.",
    getStartedTitle: "PRONTO PER LA CHIAREZZA?",
    getStartedButton: "INIZIA IL VIAGGIO",
    evangelismTitle: "NON SEI CRISTIANO? INIZIA QUI.",
    evangelismPhilosophy: "Filosofia Hazon",
    evangelismPrayerSubtitle: "Una preghiera per ricevere Cristo",
    evangelismDesc: "Hazon si basa sulla verità che Gesù Cristo è la Via.",
    evangelismSub: "Puoi ricevere questo indipendentemente dai tuoi peccati.",
    evangelismPrayerTitle: "Preghiera di Fede",
    evangelismPrayer: "Padre Celeste,\nRiconosco di aver vissuto lontano da Te...",
    savedByGrace: "Ora sei salvato per grazia mediante la fede in Gesù Cristo.",
    copyright: "Una Visione Chiara",
    language: "Lingua",
    supportHazon: "Sostieni Hazon",
    improvementSuggestions: "Suggerimenti di Miglioramento",
    contribute: "Contribuisci",
    supportDesc: "Il tuo supporto ci aiuta a mantenere operativo Hazon, permettendoci di aiutare cercatori e credenti in tutto il mondo. Ogni contributo è un investimento nella missione di portare chiarezza centrata su Dio a coloro che cercano direzione.",
    amount: "IMPORTO",
    minContribution: "Inserisci un contributo di $1 o più."
  },
  de: {
    login: "ANMELDEN", signup: "REGISTRIEREN", emailLabel: "E-Mail", passwordLabel: "Passwort", nameLabel: "Name",
    newVision: "NEUE VISION", library: "BIBLIOTHEK", profile: "Profil", logout: "ABMELDEN", 
    reflecting: "Reflektieren...", generateVision: "DOKUMENT ERSTELLEN",
    download: "ALS BILD SPEICHERN", clearVision: "EINE KLARE VISION.", beginJourney: "HIER STARTEN",
    tagline: "Ein einfacher Weg, Klarheit zu finden und Ihre nächsten Schritte mit Gottes Wort zu planen.",
    visions: "Ihre Visionen", noVisions: "KEINE VISIONEN GEFUNDEN.", backToLogin: "ZURÜCK ZUM LOGIN", createAccount: "KONTO ERSTELLEN",
    reflectHere: "Teilen Sie Ihre Gedanken...", readyForSynthesis: "bereit zur Erstellung",
    finalizePrompt: "Sie haben Klarheit gefunden. Möchten Sie jetzt Ihr Visionsdokument erstellen?",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte überprüfen Sie Ihre Verbindung.",
    errorAuth: "Die eingegebene E-Mail oder das Passwort ist falsch.",
    errorDuplicate: "Ein Konto mit dieser E-Mail existiert bereits.",
    errorNotFound: "Kein Konto mit dieser E-Mail-Adresse gefunden.",
    progressLabel: "FORTSCHRITT",
    accountInfo: "KONTODETAILS",
    save: "KARTE SPEICHERN",
    back: "Zurück",
    currencyLabel: "Bevorzugte Währung",
    continueGoogle: "Mit Google fortfahren",
    truthTagline: "WAHRHEIT ZÄHLT MEHR ALS POLIERTE WORTE.",
    enter: "EINTRETEN",
    sendResetLink: "RESET-LINK SENDEN",
    forgotPassword: "PASSWORT VERGESSEN?",
    countSuffix: "VISIONEN",
    profileSaveError: "Profil konnte nicht gespeichert werden.",
    profileSaveSuccess: "Ihr Profil wurde aktualisiert.",
    open: "Öffnen",
    paywallTitle: "Schalten Sie Ihre Vision frei",
    paywallTitleUnlocked: "Vision freigeschaltet",
    paywallDesc: "Ein kleiner Beitrag, um Hazon am Laufen zu halten.",
    paywallPrice: "$3.00",
    paywallAction: "Vision freischalten",
    preparingPayment: "Sichere Zahlung wird vorbereitet...",
    generatingTitle: "Ihre Vision wird erstellt...",
    generatingDesc: "Hazon synthetisiert Ihre Reflexionen in ein biblisches Dokument.",
    confSignupTitle: "Posteingang prüfen",
    confSignupDesc: "Ihr Konto wurde erstellt. Prüfen Sie Ihre E-Mail.",
    confForgotTitle: "Posteingang prüfen",
    confForgotDesc: "Wenn ein Konto existiert, haben wir einen Wiederherstellungslink gesendet.",
    notFoundTitle: "404 - Vision nicht gefunden",
    notFoundDesc: "Der gesuchte Pfad existiert nicht.",
    returnLibrary: "ZURÜCK ZUR BIBLIOTHEK",
    drafts: "Entwürfe",
    completed: "Abgeschlossen",
    retry: "WIEDERHOLEN",
    errorFetch: "Verbindung fehlgeschlagen.",
    paymentCancelled: "Zahlung wurde nicht abgeschlossen.",
    verificationFailed: "Zahlung konnte nicht verifiziert werden.",
    initPaymentFailed: "Zahlung konnte nicht initialisiert werden.",
    verifyingPayment: "Zahlung wird verifiziert...",
    paymentSettings: "Zahlungsmethoden",
    addCard: "Neue Karte hinzufügen",
    cardName: "Karteninhaber",
    cardNumber: "Kartennummer",
    expiryDate: "Ablaufdatum (MM/JJ)",
    cvv: "CVV",
    remove: "Entfernen",
    noCards: "Keine gespeicherten Karten.",
    stopMic: "STOPP",
    listening: "Zuhören...",
    aboutTitle: "ÜBER HAZON",
    aboutSubtitle1: "Hazon ist ein biblischer Begleiter zur Unterscheidung.",
    aboutPara1Sub: "Klarheit offenbart sich, wenn unser Denken mit Gottes Weisheit übereinstimmt.",
    aboutSubtitle2: "Ein Begleiter zur Unterscheidung",
    aboutPara2Sub: "Hazon begleitet Sie bei der Suche nach Orientierung.",
    aboutSubtitle3: "Geführt von der Schrift",
    aboutPara3Sub: "Hazon hilft, Ordnung in Ihre Gedanken zu bringen.",
    aboutSubtitle4: "Für Suchende und Gläubige",
    aboutPara4Sub: "Hazon ist eine Einladung zur Weisheit.",
    aboutScripture1: "Wo keine Offenbarung ist, wird das Volk wild. — Sprüche 29,18",
    aboutScripture2: "Schreibe die Vision auf... damit man sie geläufig lesen kann. — Habakuk 2,2",
    howItWorksTitle: "WIE ES FUNKTIONIERT",
    step1: "Reflektieren",
    step1Desc: "Sprechen Sie ehrlich darüber, was Sie bewegt.",
    step2: "Unterscheiden",
    step2Desc: "Gewinnen Sie Klarheit durch biblische Weisheit.",
    step3: "Visualisieren",
    step3Desc: "Erhalten Sie eine klare Vision.",
    getStartedTitle: "Bereit für Klarheit?",
    getStartedButton: "MEINE REISE BEGINNEN",
    evangelismTitle: "KEIN CHRIST? HIER STARTEN.",
    evangelismPhilosophy: "Hazon Philosophie",
    evangelismPrayerSubtitle: "Ein Gebet, um Christus anzunehmen",
    evangelismDesc: "Hazon gründet auf der Wahrheit, dass Jesus Christus der Weg ist.",
    evangelismSub: "Sie können dies unabhängig von Ihren Sünden empfangen.",
    evangelismPrayerTitle: "Ein Gebet des Glaubens",
    evangelismPrayer: "Himmlischer Vater,\nich bekenne, dass ich getrennt von Dir gelebt habe...",
    savedByGrace: "Sie sind nun aus Gnade durch den Glauben an Jesus Christus gerettet.",
    copyright: "Hazon | Eine klare Vision",
    language: "Sprache",
    supportHazon: "Hazon unterstützen",
    improvementSuggestions: "Verbesserungsvorschläge",
    contribute: "Beitragen",
    supportDesc: "Ihre Unterstützung hilft uns, Hazon am Laufen zu halten, und ermöglicht es uns, Suchenden und Gläubigen weltweit zu helfen. Jeder Beitrag ist eine Investition in die Mission, denjenigen, die Richtung suchen, gottzentrierte Klarheit zu bringen.",
    amount: "BETRAG",
    minContribution: "Bitte geben Sie einen Beitrag von 1 $ oder mehr ein."
  },
  nl: {
    login: "INLOGGEN", signup: "REGISTREREN", emailLabel: "E-mail", passwordLabel: "Wachtwoord", nameLabel: "Naam",
    newVision: "NIEUWE VISIE", library: "BIBLIOTHEEK", profile: "Profiel", logout: "UITLOGGEN", 
    reflecting: "Reflecteren...", generateVision: "VISIEDOCUMENT MAKEN",
    download: "OPSLAAN ALS AFBEELDING", clearVision: "EEN HELDERE VISIE.", beginJourney: "HIER STARTEN",
    tagline: "Een eenvoudige manier om helderheid te vinden en uw volgende stappen te plannen met Gods Woord.",
    visions: "Uw Visies", noVisions: "GEEN VISIES GEVONDEN.", backToLogin: "TERUG NAAR LOGIN", createAccount: "ACCOUNT AANMAKEN",
    reflectHere: "Deel uw gedachten...", readyForSynthesis: "klaar voor generatie",
    finalizePrompt: "U heeft helderheid gevonden. Wilt u nu uw visiedocument maken?",
    errorGeneric: "Er is iets misgegaan. Controleer uw verbinding.",
    errorAuth: "Het e-mailadres of wachtwoord is onjuist.",
    errorDuplicate: "Er bestaat al een account met dit e-mailadres.",
    errorNotFound: "Geen account gevonden met dit e-mailadres.",
    progressLabel: "VOORTGANG",
    accountInfo: "ACCOUNTGEGEVENS",
    save: "KAART OPSLAAN",
    back: "Terug",
    currencyLabel: "Voorkeursvaluta",
    continueGoogle: "Doorgaan met Google",
    truthTagline: "WAARHEID IS BELANGRIJKER DAN GEPOLIJSTE WOORDEN.",
    enter: "BINNENGAAN",
    sendResetLink: "RESETLINK VERZENDEN",
    forgotPassword: "WACHTWOORD VERGETEN?",
    countSuffix: "VISIES",
    profileSaveError: "Profiel kon niet worden opgeslagen.",
    profileSaveSuccess: "Uw profiel is bijgewerkt.",
    open: "Openen",
    paywallTitle: "Ontgrendel uw visie",
    paywallTitleUnlocked: "Visie ontgrendeld",
    paywallDesc: "Een kleine bijdrage om Hazon draaiende te houden.",
    paywallPrice: "$3.00",
    paywallAction: "Visie ontgrendelen",
    preparingPayment: "Beveiligde betaling voorbereiden...",
    generatingTitle: "Uw visie wordt gemaakt...",
    generatingDesc: "Hazon synthetiseert uw reflecties in een bijbels document.",
    confSignupTitle: "Controleer uw inbox",
    confSignupDesc: "Uw account is aangemaakt. Controleer uw e-mail.",
    confForgotTitle: "Controleer uw inbox",
    confForgotDesc: "Als er een account bestaat, hebben we een herstellink gestuurd.",
    notFoundTitle: "404 - Visie niet gevonden",
    notFoundDesc: "Het gezochte pad bestaat niet.",
    returnLibrary: "TERUG NAAR BIBLIOTHEEK",
    drafts: "Concepten",
    completed: "Voltooid",
    retry: "OPNIEUW PROBEREN",
    errorFetch: "Verbinding mislukt.",
    paymentCancelled: "Betaling is niet voltooid.",
    verificationFailed: "Betaling kon niet worden geverifieerd.",
    initPaymentFailed: "Betaling kon niet worden geïnitialiseerd.",
    verifyingPayment: "Betaling wordt geverifieerd...",
    paymentSettings: "Betaalmethoden",
    addCard: "Nieuwe kaart toevoegen",
    cardName: "Kaarthouder",
    cardNumber: "Kaartnummer",
    expiryDate: "Vervaldatum (MM/JJ)",
    cvv: "CVV",
    remove: "Verwijderen",
    noCards: "Geen opgeslagen kaarten.",
    stopMic: "STOP",
    listening: "Luisteren...",
    aboutTitle: "OVER HAZON",
    aboutSubtitle1: "Hazon is een bijbelse metgezel voor onderscheiding.",
    aboutPara1Sub: "Helderheid wordt geopenbaard wanneer ons denken in lijn is met Gods wijsheid.",
    aboutSubtitle2: "Een metgezel voor onderscheiding",
    aboutPara2Sub: "Hazon wandelt met u mee bij het zoeken naar richting.",
    aboutSubtitle3: "Geleid door de Schrift",
    aboutPara3Sub: "Hazon helpt orde te scheppen in uw gedachten.",
    aboutSubtitle4: "Voor zoekers en gelovigen",
    aboutPara4Sub: "Hazon is een uitnodiging tot wijsheid.",
    aboutScripture1: "Waar geen visioen is, verwildert het volk. — Spreuken 29:18",
    aboutScripture2: "Schrijf het visioen op... opdat men het in het voorbijlopen kan lezen. — Habakuk 2:2",
    howItWorksTitle: "HOE HET WERKT",
    step1: "Reflecteren",
    step1Desc: "Spreek eerlijk over wat er in uw hart leeft.",
    step2: "Onderscheiden",
    step2Desc: "Krijg helderheid door bijbelse wijsheid.",
    step3: "Visualiseren",
    step3Desc: "Ontvang een heldere visie.",
    getStartedTitle: "Klaar voor helderheid?",
    getStartedButton: "MIJN REIS BEGINNEN",
    evangelismTitle: "GEEN CHRISTEN? START HIER.",
    evangelismPhilosophy: "Hazon Filosofie",
    evangelismPrayerSubtitle: "Een gebed om Christus te ontvangen",
    evangelismDesc: "Hazon is gegrondvest op de waarheid dat Jezus Christus de Weg is.",
    evangelismSub: "U kunt dit ontvangen ongeacht uw zonden.",
    evangelismPrayerTitle: "Een gebed van geloof",
    evangelismPrayer: "Hemelse Vader,\nik erken dat ik gescheiden van U heb geleefd...",
    savedByGrace: "U bent nu gered door genade door geloof in Jezus Christus.",
    copyright: "Hazon | Een heldere visie",
    language: "Taal",
    supportHazon: "Hazon ondersteunen",
    improvementSuggestions: "Verbetersuggesties",
    contribute: "Bijdragen",
    supportDesc: "Uw steun helpt ons Hazon draaiende te houden, waardoor we zoekers en gelovigen wereldwijd kunnen helpen. Elke bijdrage is een investering in de missie om godgerichte helderheid te brengen aan degenen die richting zoeken.",
    amount: "BEDRAG",
    minContribution: "Voer een bijdrage van $1 of meer in."
  },
  ar: {
    login: "تسجيل الدخول", signup: "إنشاء حساب", emailLabel: "البريد الإلكتروني", passwordLabel: "كلمة المرور", nameLabel: "الاسم",
    newVision: "رؤية جديدة", library: "المكتبة", profile: "الملف الشخصي", logout: "تسجيل الخروج", 
    reflecting: "جارٍ التفكير...", generateVision: "إنشاء وثيقة الرؤية",
    download: "حفظ كصورة", clearVision: "رؤية واضحة.", beginJourney: "ابدأ من هنا",
    tagline: "طريقة بسيطة للعثور على الوضوح والتخطيط لخطواتك القادمة باستخدام كلمة الله.",
    visions: "رؤاك", noVisions: "لم يتم العثور على رؤى.", backToLogin: "العودة لتسجيل الدخول", createAccount: "إنشاء حساب",
    reflectHere: "شارك أفكارك...", readyForSynthesis: "جاهز للإنشاء",
    finalizePrompt: "لقد وجدت الوضوح. هل ترغب في إنشاء وثيقة رؤيتك الآن؟",
    errorGeneric: "حدث خطأ ما. يرجى التحقق من الاتصال.",
    errorAuth: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errorDuplicate: "هذا الحساب موجود بالفعل.",
    errorNotFound: "لم يتم العثور على الحساب.",
    progressLabel: "التقدم",
    accountInfo: "تفاصيل الحساب",
    save: "حفظ البطاقة",
    back: "رجوع",
    currencyLabel: "العملة المفضلة",
    continueGoogle: "المتابعة باستخدام جوجل",
    truthTagline: "الحقيقة تهم أكثر من الكلمات المنمقة.",
    enter: "دخول",
    sendResetLink: "إرسال رابط إعادة التعيين",
    forgotPassword: "هل نسيت كلمة المرور؟",
    countSuffix: "رؤى",
    profileSaveError: "فشل في حفظ الملف الشخصي.",
    profileSaveSuccess: "تم تحديث الملف الشخصي.",
    open: "فتح",
    paywallTitle: "افتح رؤيتك",
    paywallTitleUnlocked: "تم فتح الرؤية",
    paywallDesc: "مساهمة صغيرة للحفاظ على هازون ودعم رحلتك.",
    paywallPrice: "$3.00",
    paywallAction: "فتح الرؤية",
    preparingPayment: "جارٍ تحضير الدفع الآمن...",
    generatingTitle: "جارٍ إنشاء رؤيتك...",
    generatingDesc: "هازون يقوم بتوليف تأملاتك في وثيقة توافق كتابي.",
    confSignupTitle: "تحقق من بريدك الوارد",
    confSignupDesc: "تم إنشاء حسابك. تحقق من بريدك الإلكتروني.",
    confForgotTitle: "تحقق من بريدك الوارد",
    confForgotDesc: "تم إرسال رابط الاسترداد.",
    notFoundTitle: "404 - الرؤية غير موجودة",
    notFoundDesc: "المسار الذي تبحث عنه غير موجود.",
    returnLibrary: "العودة إلى المكتبة",
    drafts: "المسودات",
    completed: "المكتملة",
    retry: "إعادة المحاولة",
    errorFetch: "فشل الاتصال.",
    paymentCancelled: "لم يكتمل الدفع.",
    verificationFailed: "فشل التحقق من الدفع.",
    initPaymentFailed: "فشل في بدء الدفع.",
    verifyingPayment: "جارٍ التحقق من الدفع...",
    paymentSettings: "طرق الدفع",
    addCard: "إضافة بطاقة جديدة",
    cardName: "اسم صاحب البطاقة",
    cardNumber: "رقم البطاقة",
    expiryDate: "تاريخ الانتهاء (MM/YY)",
    cvv: "CVV",
    remove: "إزالة",
    noCards: "لا توجد بطاقات محفوظة.",
    stopMic: "توقف",
    listening: "جارٍ الاستماع...",
    aboutTitle: "عن هازون",
    aboutSubtitle1: "هازون هو رفيق تمييز كتابي.",
    aboutPara1Sub: "يتجلى الوضوح عندما يتماشى تفكيرنا مع حكمة الله.",
    aboutSubtitle2: "رفيق للتمييز",
    aboutPara2Sub: "يسير هازون معك وأنت تبحث عن الاتجاه.",
    aboutSubtitle3: "مسترشد بالكتاب المقدس",
    aboutPara3Sub: "يساعد هازون في ترتيب أفكارك.",
    aboutSubtitle4: "للباحثين والمؤمنين",
    aboutPara4Sub: "هازون هو دعوة للحكمة.",
    aboutScripture1: "بلا رؤية يجمح الشعب. — أمثال 29:18",
    aboutScripture2: "اكتب الرؤية وانقشها... لكي يركض قارئها. — حبقوق 2:2",
    howItWorksTitle: "كيف يعمل",
    step1: "تأمل",
    step1Desc: "تحدث بصدق عما في قلبك.",
    step2: "ميز",
    step2Desc: "احصل على الوضوح من خلال الحكمة الكتابية.",
    step3: "تصور",
    step3Desc: "احصل على رؤية واضحة.",
    getStartedTitle: "جاهز للوضوح؟",
    getStartedButton: "ابدأ رحلتي",
    evangelismTitle: "لست مسيحياً؟ ابدأ هنا.",
    evangelismPhilosophy: "فلسفة هازون",
    evangelismPrayerSubtitle: "صلاة لقبول المسيح",
    evangelismDesc: "هازون يرتكز على حقيقة أن يسوع المسيح هو الطريق.",
    evangelismSub: "يمكنك قبول هذا بغض النظر عن خطاياك.",
    evangelismPrayerTitle: "صلاة إيمان",
    evangelismPrayer: "أيها الآب السماوي،\nأعترف بأنني عشت بعيداً عنك...",
    savedByGrace: "أنت الآن مخلص بالنعمة من خلال الإيمان بيسوع المسيح.",
    copyright: "هازون | رؤية واضحة",
    language: "اللغة",
    supportHazon: "دعم هازون",
    improvementSuggestions: "اقتراحات التحسين",
    contribute: "ساهم"
  },
  ru: {
    login: "ВОЙТИ", signup: "РЕГИСТРАЦИЯ", emailLabel: "Email", passwordLabel: "Пароль", nameLabel: "Имя",
    newVision: "НОВОЕ ВИДЕНИЕ", library: "БИБЛИОТЕКА", profile: "Профиль", logout: "ВЫЙТИ", 
    reflecting: "Размышление...", generateVision: "СОЗДАТЬ ДОКУМЕНТ",
    download: "СОХРАНИТЬ КАК ИЗОБРАЖЕНИЕ", clearVision: "ЯСНОЕ ВИДЕНИЕ.", beginJourney: "НАЧАТЬ ЗДЕСЬ",
    tagline: "Простой способ обрести ясность и спланировать следующие шаги с помощью Слова Божьего.",
    visions: "Ваши видения", noVisions: "ВИДЕНИЙ НЕ НАЙДЕНО.", backToLogin: "НАЗАД К ВХОДУ", createAccount: "СОЗДАТЬ АККАУНТ",
    reflectHere: "Поделитесь мыслями...", readyForSynthesis: "готово к генерации",
    finalizePrompt: "Вы обрели ясность. Хотите создать документ видения сейчас?",
    errorGeneric: "Что-то пошло не так. Проверьте соединение.",
    errorAuth: "Неверный email или пароль.",
    errorDuplicate: "Аккаунт с таким email уже существует.",
    errorNotFound: "Аккаунт не найден.",
    progressLabel: "ПРОГРЕСС",
    accountInfo: "ДАННЫЕ АККАУНТА",
    save: "СОХРАНИТЬ КАРТУ",
    back: "Назад",
    currencyLabel: "Валюта",
    continueGoogle: "Войти через Google",
    truthTagline: "ИСТИНА ВАЖНЕЕ КРАСИВЫХ СЛОВ.",
    enter: "ВОЙТИ",
    sendResetLink: "ОТПРАВИТЬ ССЫЛКУ",
    forgotPassword: "ЗАБЫЛИ ПАРОЛЬ?",
    countSuffix: "ВИДЕНИЙ",
    profileSaveError: "Ошибка сохранения профиля.",
    profileSaveSuccess: "Профиль обновлен.",
    open: "Открыть",
    paywallTitle: "Разблокировать видение",
    paywallTitleUnlocked: "Видение разблокировано",
    paywallDesc: "Небольшой вклад для поддержки Hazon.",
    paywallPrice: "$3.00",
    paywallAction: "Разблокировать",
    preparingPayment: "Подготовка платежа...",
    generatingTitle: "Создание видения...",
    generatingDesc: "Hazon синтезирует ваши размышления в библейский документ.",
    confSignupTitle: "Проверьте почту",
    confSignupDesc: "Аккаунт создан. Подтвердите email.",
    confForgotTitle: "Проверьте почту",
    confForgotDesc: "Ссылка для восстановления отправлена.",
    notFoundTitle: "404 - Видение не найдено",
    notFoundDesc: "Путь не найден.",
    returnLibrary: "ВЕРНУТЬСЯ В БИБЛИОТЕКУ",
    drafts: "Черновики",
    completed: "Завершено",
    retry: "ПОВТОРИТЬ",
    errorFetch: "Ошибка соединения.",
    paymentCancelled: "Оплата отменена.",
    verificationFailed: "Ошибка верификации.",
    initPaymentFailed: "Ошибка инициализации платежа.",
    verifyingPayment: "Верификация платежа...",
    paymentSettings: "Методы оплаты",
    addCard: "Добавить карту",
    cardName: "Имя на карте",
    cardNumber: "Номер карты",
    expiryDate: "Срок (ММ/ГГ)",
    cvv: "CVV",
    remove: "Удалить",
    noCards: "Нет сохраненных карт.",
    stopMic: "СТОП",
    listening: "Слушаю...",
    aboutTitle: "О HAZON",
    aboutSubtitle1: "Hazon — ваш библейский спутник.",
    aboutPara1Sub: "Ясность приходит, когда наши мысли согласуются с Божьей мудростью.",
    aboutSubtitle2: "Спутник для различения",
    aboutPara2Sub: "Hazon идет рядом с вами в поиске пути.",
    aboutSubtitle3: "Основано на Писании",
    aboutPara3Sub: "Hazon помогает упорядочить мысли.",
    aboutSubtitle4: "Для ищущих и верующих",
    aboutPara4Sub: "Hazon — это приглашение к мудрости.",
    aboutScripture1: "Без откровения свыше народ необуздан. — Притчи 29:18",
    aboutScripture2: "Запиши видение... чтобы читающий мог легко бежать. — Аввакум 2:2",
    howItWorksTitle: "КАК ЭТО РАБОТАЕТ",
    step1: "Размышление",
    step1Desc: "Честно расскажите о том, что у вас на сердце.",
    step2: "Различение",
    step2Desc: "Обретите ясность через библейскую мудрость.",
    step3: "Визуализация",
    step3Desc: "Получите четкое видение.",
    getStartedTitle: "Готовы к ясности?",
    getStartedButton: "НАЧАТЬ ПУТЬ",
    evangelismTitle: "НЕ ХРИСТИАНИН? НАЧНИТЕ ЗДЕСЬ.",
    evangelismPhilosophy: "Философия Hazon",
    evangelismPrayerSubtitle: "Молитва принятия Христа",
    evangelismDesc: "Hazon основан на истине, что Иисус Христос — это Путь.",
    evangelismSub: "Вы можете принять это независимо от ваших грехов.",
    evangelismPrayerTitle: "Молитва веры",
    evangelismPrayer: "Небесный Отец,\nЯ признаю, что жил вдали от Тебя...",
    savedByGrace: "Вы спасены благодатью через веру в Иисуса Христа.",
    copyright: "Hazon | Ясное видение",
    language: "Язык",
    supportHazon: "Поддержать Hazon",
    improvementSuggestions: "Предложения по улучшению",
    contribute: "Внести вклад",
    supportDesc: "Ваша поддержка помогает нам поддерживать работу Hazon, позволяя нам помогать искателям и верующим по всему миру. Каждый вклад — это инвестиция в миссию несения богоцентричной ясности тем, кто ищет направление.",
    amount: "СУММА",
    minContribution: "Пожалуйста, введите сумму пожертвования от 1 доллара или больше."
  },
  zh: {
    login: "登录", signup: "注册", emailLabel: "电子邮件", passwordLabel: "密码", nameLabel: "姓名",
    newVision: "新异象", library: "图书馆", profile: "个人资料", logout: "登出", 
    reflecting: "思考中...", generateVision: "创建异象文档",
    download: "保存为图片", clearVision: "清晰的异象。", beginJourney: "从这里开始",
    tagline: "通过上帝的话语寻找清晰方向并规划下一步的简单方法。",
    visions: "您的异象", noVisions: "未找到异象。", backToLogin: "返回登录", createAccount: "创建账户",
    reflectHere: "分享您的想法...", readyForSynthesis: "准备生成",
    finalizePrompt: "您已找到清晰方向。现在要创建异象文档吗？",
    errorGeneric: "出错了。请检查您的网络连接。",
    errorAuth: "电子邮件或密码错误。",
    errorDuplicate: "该电子邮件已注册。",
    errorNotFound: "未找到该账户。",
    progressLabel: "进度",
    accountInfo: "账户详情",
    save: "保存卡片",
    back: "返回",
    currencyLabel: "首选货币",
    continueGoogle: "使用 Google 继续",
    truthTagline: "真理比华丽的辞藻更重要。",
    enter: "进入",
    sendResetLink: "发送重置链接",
    forgotPassword: "忘记密码？",
    countSuffix: "个异象",
    profileSaveError: "无法保存个人资料。",
    profileSaveSuccess: "个人资料已更新。",
    open: "打开",
    paywallTitle: "解锁您的异象",
    paywallTitleUnlocked: "异象已解锁",
    paywallDesc: "小额捐助以维持 Hazon 运行并支持您的旅程。",
    paywallPrice: "$3.00",
    paywallAction: "解锁异象",
    preparingPayment: "正在准备安全支付...",
    generatingTitle: "正在生成您的异象...",
    generatingDesc: "Hazon 正在将您的思考综合成一份符合圣经的文档。",
    confSignupTitle: "检查您的收件箱",
    confSignupDesc: "账户已创建。请检查您的电子邮件。",
    confForgotTitle: "检查您的收件箱",
    confForgotDesc: "已发送恢复链接。",
    notFoundTitle: "404 - 未找到异象",
    notFoundDesc: "您寻找的路径不存在。",
    returnLibrary: "返回图书馆",
    drafts: "草稿",
    completed: "已完成",
    retry: "重试",
    errorFetch: "连接失败。",
    paymentCancelled: "支付未完成。",
    verificationFailed: "支付验证失败。",
    initPaymentFailed: "无法初始化支付。",
    verifyingPayment: "正在验证支付...",
    paymentSettings: "支付方式",
    addCard: "添加新卡",
    cardName: "持卡人姓名",
    cardNumber: "卡号",
    expiryDate: "有效期 (MM/YY)",
    cvv: "CVV",
    remove: "移除",
    noCards: "没有保存的卡片。",
    stopMic: "停止",
    listening: "正在倾听...",
    aboutTitle: "关于 HAZON",
    aboutSubtitle1: "Hazon 是一个圣经辨析伙伴。",
    aboutPara1Sub: "当我们的思维与上帝的智慧一致时，清晰就会显现。",
    aboutSubtitle2: "辨析的伙伴",
    aboutPara2Sub: "当您寻求方向时，Hazon 与您同行。",
    aboutSubtitle3: "以圣经为导向",
    aboutPara3Sub: "Hazon 帮助理顺您的思绪。",
    aboutSubtitle4: "面向寻求者和信徒",
    aboutPara4Sub: "Hazon 是对智慧的邀请。",
    aboutScripture1: "没有异象，民就放肆。—— 箴言 29:18",
    aboutScripture2: "将这默示明明地写在版上... 使读的人可以奔跑。—— 哈巴谷书 2:2",
    howItWorksTitle: "工作原理",
    step1: "反思",
    step1Desc: "在引导式的对话中诚实地表达您的心声。",
    step2: "辨析",
    step2Desc: "通过永恒的圣经智慧获得清晰方向。",
    step3: "可视化",
    step3Desc: "获得一份清晰且精美的异象文档。",
    getStartedTitle: "准备好寻找清晰方向了吗？",
    getStartedButton: "开始我的旅程",
    evangelismTitle: "不是基督徒？从这里开始。",
    evangelismPhilosophy: "Hazon 哲学",
    evangelismPrayerSubtitle: "接受基督的祷告",
    evangelismDesc: "Hazon 建立在耶稣基督是道路、真理、生命的真理之上。",
    evangelismSub: "无论您的罪如何，您都可以接受这份救恩。",
    evangelismPrayerTitle: "信心的祷告",
    evangelismPrayer: "天父，\n我承认我曾远离你...",
    savedByGrace: "您现在是因着恩典、借着对耶稣基督的信心而得救。",
    copyright: "Hazon | 清晰的异象",
    language: "语言",
    supportHazon: "支持 Hazon",
    improvementSuggestions: "改进建议",
    contribute: "捐助",
    supportDesc: "您的支持帮助我们维持 Hazon 的运行，使我们能够帮助世界各地的寻求者和信徒。每一份贡献都是对为寻求方向的人带来以神为中心的清晰这一使命的投资。",
    amount: "金额",
    minContribution: "请输入 1 美元或以上的捐款。"
  },
  hi: {
    login: "लॉग इन", signup: "साइन अप", emailLabel: "ईमेल", passwordLabel: "पासवर्ड", nameLabel: "नाम",
    newVision: "नया विजन", library: "लाइब्रेरी", profile: "प्रोफ़ाइल", logout: "साइन आउट", 
    reflecting: "चिंतन कर रहे हैं...", generateVision: "विजन दस्तावेज़ बनाएँ",
    download: "छवि के रूप में सहेजें", clearVision: "एक स्पष्ट विजन।", beginJourney: "यहाँ से शुरू करें",
    tagline: "परमेश्वर के वचन का उपयोग करके स्पष्टता पाने और अपने अगले कदमों की योजना बनाने का एक सरल तरीका।",
    visions: "आपके विजन", noVisions: "कोई विजन नहीं मिला।", backToLogin: "लॉगिन पर वापस जाएँ", createAccount: "खाता बनाएँ",
    reflectHere: "अपने विचार साझा करें...", readyForSynthesis: "निर्माण के लिए तैयार",
    finalizePrompt: "आपको स्पष्टता मिल गई है। क्या आप अभी अपना विजन दस्तावेज़ बनाना चाहेंगे?",
    errorGeneric: "कुछ गलत हो गया। कृपया अपना कनेक्शन जांचें।",
    errorAuth: "आपके द्वारा दर्ज किया गया ईमेल या पासवर्ड गलत है।",
    errorDuplicate: "इस ईमेल वाला खाता पहले से मौजूद है।",
    errorNotFound: "इस ईमेल पते के साथ कोई खाता नहीं मिला।",
    progressLabel: "प्रगति",
    accountInfo: "खाता विवरण",
    save: "कार्ड सहेजें",
    back: "वापस",
    currencyLabel: "पसंदीदा मुद्रा",
    continueGoogle: "गूगल के साथ जारी रखें",
    truthTagline: "सत्य पॉलिश किए गए शब्दों से अधिक महत्वपूर्ण है।",
    enter: "प्रवेश",
    sendResetLink: "रिसेट लिंक भेजें",
    forgotPassword: "पासवर्ड भूल गए?",
    countSuffix: "विजन",
    profileSaveError: "प्रोफ़ाइल सहेजने में विफल।",
    profileSaveSuccess: "प्रोफ़ाइल अपडेट हो गई है।",
    open: "खोलें",
    paywallTitle: "अपना विजन अनलॉक करें",
    paywallTitleUnlocked: "विजन अनलॉक हो गया",
    paywallDesc: "Hazon को चालू रखने के लिए एक छोटा सा योगदान।",
    paywallPrice: "$3.00",
    paywallAction: "विजन अनलॉक करें",
    preparingPayment: "सुरक्षित भुगतान की तैयारी...",
    generatingTitle: "आपका विजन तैयार किया जा रहा है...",
    generatingDesc: "Hazon आपके विचारों को एक दस्तावेज़ में संश्लेषित कर रहा है।",
    confSignupTitle: "इनबॉक्स चेक करें",
    confSignupDesc: "खाता बन गया है। ईमेल चेक करें।",
    confForgotTitle: "इनबॉक्स चेक करें",
    confForgotDesc: "रिकवरी लिंक भेज दिया गया है।",
    notFoundTitle: "404 - विजन नहीं मिला",
    notFoundDesc: "आप जो पथ खोज रहे हैं वह मौजूद नहीं है।",
    returnLibrary: "लाइब्रेरी पर वापस जाएँ",
    drafts: "ड्राफ्ट",
    completed: "पूरा हुआ",
    retry: "पुनः प्रयास करें",
    errorFetch: "कनेक्शन विफल।",
    paymentCancelled: "भुगतान पूरा नहीं हुआ।",
    verificationFailed: "भुगतान सत्यापित नहीं किया जा सका।",
    initPaymentFailed: "भुगतान शुरू नहीं किया जा सका।",
    verifyingPayment: "भुगतान सत्यापित किया जा रहा है...",
    paymentSettings: "भुगतान के तरीके",
    addCard: "नया कार्ड जोड़ें",
    cardName: "कार्डधारक का नाम",
    cardNumber: "कार्ड नंबर",
    expiryDate: "समाप्ति तिथि (MM/YY)",
    cvv: "CVV",
    remove: "हटाएं",
    noCards: "कोई सहेजा गया कार्ड नहीं।",
    stopMic: "रुकें",
    listening: "सुन रहे हैं...",
    aboutTitle: "HAZON के बारे में",
    aboutSubtitle1: "Hazon एक बाइबिल आधारित साथी है।",
    aboutPara1Sub: "स्पष्टता तब प्रकट होती है जब हमारी सोच परमेश्वर की बुद्धि के साथ संरेखित होती है।",
    aboutSubtitle2: "विवेक के लिए एक साथी",
    aboutPara2Sub: "जब आप दिशा खोजते हैं तो Hazon आपके साथ चलता है।",
    aboutSubtitle3: "शास्त्र द्वारा निर्देशित",
    aboutPara3Sub: "Hazon आपके विचारों को व्यवस्थित करने में मदद करता।",
    aboutSubtitle4: "साधकों और विश्वासियों के लिए",
    aboutPara4Sub: "Hazon बुद्धि के लिए एक निमंत्रण है।",
    aboutScripture1: "जहाँ विजन नहीं है, वहाँ लोग नष्ट हो जाते हैं। — नीतिवचन 29:18",
    aboutScripture2: "विजन को लिख लो... ताकि पढ़ने वाला दौड़ सके। — हबक्कूक 2:2",
    howItWorksTitle: "यह कैसे काम करता है",
    step1: "चिंतन",
    step1Desc: "अपने दिल की बात ईमानदारी से कहें।",
    step2: "विवेक",
    step2Desc: "बाइबिल की बुद्धि के माध्यम से स्पष्टता प्राप्त करें।",
    step3: "कल्पना",
    step3Desc: "एक स्पष्ट विजन प्राप्त करें।",
    getStartedTitle: "स्पष्टता के लिए तैयार हैं?",
    getStartedButton: "अपनी यात्रा शुरू करें",
    evangelismTitle: "ईसाई नहीं हैं? यहाँ से शुरू करें।",
    evangelismPhilosophy: "Hazon दर्शन",
    evangelismPrayerSubtitle: "मसीह को स्वीकार करने की प्रार्थना",
    evangelismDesc: "Hazon इस सत्य पर आधारित है कि यीशु मसीह ही मार्ग है।",
    evangelismSub: "आप अपने पापों की परवाह किए बिना इसे प्राप्त कर सकते हैं।",
    evangelismPrayerTitle: "विश्वास की प्रार्थना",
    evangelismPrayer: "हे स्वर्गीय पिता,\nमैं स्वीकार करता हूँ कि मैं आपसे दूर रहा हूँ...",
    savedByGrace: "अब आप यीशु मसीह में विश्वास के माध्यम से अनुग्रह द्वारा बचाए गए हैं।",
    copyright: "Hazon | एक स्पष्ट विजन",
    language: "भाषा",
    supportHazon: "Hazon का समर्थन करें",
    improvementSuggestions: "सुधार के सुझाव",
    contribute: "योगदान दें",
    supportDesc: "आपका समर्थन हमें Hazon को चालू रखने में मदद करता है, जिससे हम दुनिया भर में चाहने वालों और विश्वासियों की मदद कर सकते हैं। हर योगदान दिशा चाहने वालों के लिए ईश्वर-केंद्रित स्पष्टता लाने के मिशन में एक निवेश है।",
    amount: "राशि",
    minContribution: "कृपया $1 या अधिक का योगदान दर्ज करें।"
  },
  bn: {
    login: "লগ ইন", signup: "সাইন আপ", emailLabel: "ইমেল", passwordLabel: "পাসওয়ার্ড", nameLabel: "নাম",
    newVision: "নতুন ভিশন", library: "লাইব্রেরি", profile: "প্রোফাইল", logout: "সাইন আউট", 
    reflecting: "চিন্তা করছি...", generateVision: "ভিশন ডকুমেন্ট তৈরি করুন",
    download: "ছবি হিসেবে সেভ করুন", clearVision: "একটি পরিষ্কার ভিশন।", beginJourney: "এখান থেকে শুরু করুন",
    tagline: "ঈশ্বরের বাক্য ব্যবহার করে স্বচ্ছতা পাওয়ার এবং আপনার পরবর্তী পদক্ষেপগুলি পরিকল্পনা করার একটি সহজ উপায়।",
    visions: "আপনার ভিশন", noVisions: "কোনো ভিশন পাওয়া যায়নি।", backToLogin: "লগইনে ফিরে যান", createAccount: "অ্যাকাউন্ট তৈরি করুন",
    reflectHere: "আপনার চিন্তা শেয়ার করুন...", readyForSynthesis: "তৈরির জন্য প্রস্তুত",
    finalizePrompt: "আপনি স্বচ্ছতা পেয়েছেন। আপনি কি এখন আপনার ভিশন ডকুমেন্ট তৈরি করতে চান?",
    errorGeneric: "কিছু ভুল হয়েছে। আপনার সংযোগ চেক করুন।",
    errorAuth: "আপনার দেওয়া ইমেল বা পাসওয়ার্ড ভুল।",
    errorDuplicate: "এই ইমেল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।",
    errorNotFound: "এই ইমেল ঠিকানার সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি।",
    progressLabel: "অগ্রগতি",
    accountInfo: "অ্যাকাউন্টের বিবরণ",
    save: "কার্ড সেভ করুন",
    back: "ফিরে যান",
    currencyLabel: "পছন্দের মুদ্রা",
    continueGoogle: "Google-এর সাথে চালিয়ে যান",
    truthTagline: "পালিশ করা শব্দের চেয়ে সত্য বেশি গুরুত্বপূর্ণ।",
    enter: "প্রবেশ করুন",
    sendResetLink: "রিসেট লিঙ্ক পাঠান",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    countSuffix: "ভিশন",
    profileSaveError: "প্রোফাইল সেভ করতে ব্যর্থ।",
    profileSaveSuccess: "আপনার প্রোফাইল আপডেট করা হয়েছে।",
    open: "খুলুন",
    paywallTitle: "আপনার ভিশন আনলক করুন",
    paywallTitleUnlocked: "ভিশন আনলক করা হয়েছে",
    paywallDesc: "Hazon চালু রাখতে এবং আপনার যাত্রায় সহায়তা করতে একটি ছোট অবদান।",
    paywallPrice: "$3.00",
    paywallAction: "ভিশন আনলক করুন",
    preparingPayment: "নিরাপদ পেমেন্ট প্রস্তুত করা হচ্ছে...",
    generatingTitle: "আপনার ভিশন তৈরি করা হচ্ছে...",
    generatingDesc: "Hazon আপনার চিন্তাগুলিকে একটি বাইবেলের ডকুমেন্টে সংশ্লেষিত করছে।",
    confSignupTitle: "ইনবক্স চেক করুন",
    confSignupDesc: "আপনার অ্যাকাউন্ট তৈরি হয়েছে। ইমেল চেক করুন।",
    confForgotTitle: "ইনবক্স চেক করুন",
    confForgotDesc: "রিকভারি লিঙ্ক পাঠানো হয়েছে।",
    notFoundTitle: "404 - ভিশন পাওয়া যায়নি",
    notFoundDesc: "আপনি যে পথটি খুঁজছেন তা বিদ্যমান নেই।",
    returnLibrary: "লাইব্রেরিতে ফিরে যান",
    drafts: "খসড়া",
    completed: "সম্পন্ন",
    retry: "আবার চেষ্টা করুন",
    errorFetch: "সংযোগ ব্যর্থ হয়েছে।",
    paymentCancelled: "পেমেন্ট সম্পন্ন হয়নি।",
    verificationFailed: "পেমেন্ট যাচাই করা যায়নি।",
    initPaymentFailed: "পেমেন্ট শুরু করা যায়নি।",
    verifyingPayment: "পেমেন্ট যাচাই করা হচ্ছে...",
    paymentSettings: "পেমেন্ট পদ্ধতি",
    addCard: "নতুন কার্ড যোগ করুন",
    cardName: "কার্ডধারীর নাম",
    cardNumber: "কার্ড নম্বর",
    expiryDate: "মেয়াদ শেষ (MM/YY)",
    cvv: "CVV",
    remove: "সরিয়ে দিন",
    noCards: "কোনো সেভ করা কার্ড নেই।",
    stopMic: "থামুন",
    listening: "শুনছি...",
    aboutTitle: "HAZON সম্পর্কে",
    aboutSubtitle1: "Hazon একটি বাইবেলের বিচক্ষণতার সঙ্গী।",
    aboutPara1Sub: "স্বচ্ছতা তখনই প্রকাশ পায় যখন আমাদের চিন্তা ঈশ্বরের প্রজ্ঞার সাথে সামঞ্জস্যপূর্ণ হয়।",
    aboutSubtitle2: "বিচক্ষণতার জন্য একজন সঙ্গী",
    aboutPara2Sub: "আপনি যখন দিকনির্দেশনা খুঁজছেন তখন Hazon আপনার সাথে চলে।",
    aboutSubtitle3: "শাস্ত্র দ্বারা পরিচালিত",
    aboutPara3Sub: "Hazon আপনার চিন্তাগুলিকে গুছিয়ে নিতে সাহায্য করে।",
    aboutSubtitle4: "সন্ধানী এবং বিশ্বাসীদের জন্য",
    aboutPara4Sub: "Hazon হলো প্রজ্ঞার জন্য একটি আমন্ত্রণ।",
    aboutScripture1: "যেখানে ভিশন নেই, সেখানে মানুষ ধ্বংস হয়। — হিতোপদেশ ২৯:১৮",
    aboutScripture2: "ভিশনটি লিখে রাখো... যাতে পাঠকারী দৌড়াতে পারে। — হাবাক্কুক ২:২",
    howItWorksTitle: "এটি কীভাবে কাজ করে",
    step1: "প্রতিফলন",
    step1Desc: "আপনার মনের কথা সততার সাথে বলুন।",
    step2: "বিচক্ষণতা",
    step2Desc: "বাইবেলের প্রজ্ঞার মাধ্যমে স্বচ্ছতা অর্জন করুন।",
    step3: "কল্পনা",
    step3Desc: "একটি পরিষ্কার ভিশন পান।",
    getStartedTitle: "স্বচ্ছতার জন্য প্রস্তুত?",
    getStartedButton: "আমার যাত্রা শুরু করুন",
    evangelismTitle: "খ্রিস্টান নন? এখান থেকে শুরু করুন।",
    evangelismPhilosophy: "Hazon দর্শন",
    evangelismPrayerSubtitle: "খ্রিস্টকে গ্রহণ করার প্রার্থনা",
    evangelismDesc: "Hazon এই সত্যের ওপর ভিত্তি করে যে যীশু খ্রীষ্টই পথ।",
    evangelismSub: "আপনি আপনার পাপ নির্বিশেষে এটি গ্রহণ করতে পারেন।",
    evangelismPrayerTitle: "বিশ্বাসের প্রার্থনা",
    evangelismPrayer: "হে স্বর্গীয় পিতা,\nআমি স্বীকার করছি যে আমি আপনার থেকে দূরে ছিলাম...",
    savedByGrace: "আপনি এখন যীশু খ্রীষ্টে বিশ্বাসের মাধ্যমে অনুগ্রহ দ্বারা রক্ষা পেয়েছেন।",
    copyright: "Hazon | একটি পরিষ্কার ভিশন",
    language: "ভাষা",
    supportHazon: "Hazon-কে সমর্থন করুন",
    improvementSuggestions: "উন্নতির পরামর্শ",
    contribute: "অবদান রাখুন",
    supportDesc: "আপনার সমর্থন আমাদের Hazon চালু রাখতে সাহায্য করে, যা আমাদের বিশ্বব্যাপী অনুসন্ধানকারী এবং বিশ্বাসীদের সাহায্য করতে দেয়। প্রতিটি অবদান দিকনির্দেশনা সন্ধানকারীদের জন্য ঈশ্বর-কেন্দ্রিক স্পষ্টতা আনার মিশনে একটি বিনিয়োগ।",
    amount: "পরিমাণ",
    minContribution: "দয়া করে $1 বা তার বেশি অবদান লিখুন।"
  },
  ja: {
    login: "ログイン", signup: "サインアップ", emailLabel: "メールアドレス", passwordLabel: "パスワード", nameLabel: "名前",
    newVision: "新しいビジョン", library: "ライブラリ", profile: "プロフィール", logout: "ログアウト", 
    reflecting: "思考中...", generateVision: "ビジョン文書を作成",
    download: "画像として保存", clearVision: "明確なビジョン。", beginJourney: "ここから開始",
    tagline: "神の言葉を用いて、明確さを見出し、次のステップを計画するシンプルな方法。",
    visions: "あなたのビジョン", noVisions: "ビジョンが見つかりません。", backToLogin: "ログインに戻る", createAccount: "アカウント作成",
    reflectHere: "考えを共有してください...", readyForSynthesis: "生成準備完了",
    finalizePrompt: "明確さが見つかりました。今すぐビジョン文書を作成しますか？",
    errorGeneric: "エラーが発生しました。接続を確認してください。",
    errorAuth: "メールアドレスまたはパスワードが正しくありません。",
    errorDuplicate: "このメールアドレスは既に登録されています。",
    errorNotFound: "アカウントが見つかりません。",
    progressLabel: "進捗",
    accountInfo: "アカウント詳細",
    save: "カードを保存",
    back: "戻る",
    currencyLabel: "優先通貨",
    continueGoogle: "Googleで続行",
    truthTagline: "真実は洗練された言葉よりも重要です。",
    enter: "入る",
    sendResetLink: "リセットリンクを送信",
    forgotPassword: "パスワードを忘れましたか？",
    countSuffix: "個のビジョン",
    profileSaveError: "保存に失敗しました。",
    profileSaveSuccess: "プロフィールを更新しました。",
    open: "開く",
    paywallTitle: "ビジョンをアンロック",
    paywallTitleUnlocked: "アンロック完了",
    paywallDesc: "Hazonの運営を維持し、あなたの旅をサポートするための少額の寄付。",
    paywallPrice: "$3.00",
    paywallAction: "アンロックする",
    preparingPayment: "安全な決済を準備中...",
    generatingTitle: "ビジョンを生成中...",
    generatingDesc: "Hazonがあなたの内省を聖書に基づいた文書にまとめています。",
    confSignupTitle: "受信トレイを確認",
    confSignupDesc: "アカウントが作成されました。メールを確認してください。",
    confForgotTitle: "受信トレイを確認",
    confForgotDesc: "リカバリリンクを送信しました。",
    notFoundTitle: "404 - 見つかりません",
    notFoundDesc: "お探しのパスは存在しません。",
    returnLibrary: "ライブラリに戻る",
    drafts: "下書き",
    completed: "完了",
    retry: "再試行",
    errorFetch: "接続に失敗しました。",
    paymentCancelled: "決済が完了しませんでした。",
    verificationFailed: "決済の確認に失敗しました。",
    initPaymentFailed: "決済の初期化に失敗しました。",
    verifyingPayment: "決済を確認中...",
    paymentSettings: "支払い方法",
    addCard: "新しいカードを追加",
    cardName: "カード名義",
    cardNumber: "カード番号",
    expiryDate: "有効期限 (MM/YY)",
    cvv: "CVV",
    remove: "削除",
    noCards: "保存されたカードはありません。",
    stopMic: "停止",
    listening: "聞き取り中...",
    aboutTitle: "HAZONについて",
    aboutSubtitle1: "Hazonは聖書的な識別の伴走者です。",
    aboutPara1Sub: "私たちの考えが神の知恵と一致するとき、明確さが明らかになります。",
    aboutSubtitle2: "識別のための伴走者",
    aboutPara2Sub: "Hazonは、あなたが方向性を求める際に共に歩みます。",
    aboutSubtitle3: "聖書に基づく導き",
    aboutPara3Sub: "Hazonは考えを整理するのを助けます。",
    aboutSubtitle4: "探求者と信者のために",
    aboutPara4Sub: "Hazonは知恵への招待です。",
    aboutScripture1: "幻がなければ、民はほしいままにふるまう。 — 箴言 29:18",
    aboutScripture2: "幻を書きしるせ... これを読む者が走りながら読むことができるように。 — ハバクク 2:2",
    howItWorksTitle: "仕組み",
    step1: "内省",
    step1Desc: "心にあることを正直に話してください。",
    step2: "識別",
    step2Desc: "聖書の知恵を通じて明確さを得ます。",
    step3: "視覚化",
    step3Desc: "明確なビジョンを受け取ります。",
    getStartedTitle: "明確さの準備はできましたか？",
    getStartedButton: "旅を始める",
    evangelismTitle: "クリスチャンではありませんか？ここから開始。",
    evangelismPhilosophy: "Hazonの哲学",
    evangelismPrayerSubtitle: "キリストを受け入れる祈り",
    evangelismDesc: "Hazonは、イエス・キリストが道であり、真理であり、命であるという真理に基づいています。",
    evangelismSub: "罪に関わらず、この救いを受け取ることができます。",
    evangelismPrayerTitle: "信仰の祈り",
    evangelismPrayer: "天の父よ、\n私はあなたから離れて生きてきたことを認めます...",
    savedByGrace: "あなたは今、イエス・キリストへの信仰による恵みによって救われました。",
    copyright: "Hazon | 明確なビジョン",
    language: "言語",
    supportHazon: "Hazonをサポート",
    improvementSuggestions: "改善の提案",
    contribute: "寄付する"
  },
  ko: {
    login: "로그인", signup: "회원가입", emailLabel: "이메일", passwordLabel: "비밀번호", nameLabel: "이름",
    newVision: "새로운 비전", library: "라이브러리", profile: "프로필", logout: "로그아웃", 
    reflecting: "생각 중...", generateVision: "비전 문서 생성",
    download: "이미지로 저장", clearVision: "명확한 비전.", beginJourney: "여기서 시작",
    tagline: "하나님의 말씀을 통해 명확함을 찾고 다음 단계를 계획하는 간단한 방법.",
    visions: "나의 비전", noVisions: "비전을 찾을 수 없습니다.", backToLogin: "로그인으로 돌아가기", createAccount: "계정 생성",
    reflectHere: "생각을 공유하세요...", readyForSynthesis: "생성 준비 완료",
    finalizePrompt: "명확함을 찾았습니다. 지금 비전 문서를 생성하시겠습니까?",
    errorGeneric: "문제가 발생했습니다. 연결을 확인하세요.",
    errorAuth: "이메일 또는 비밀번호가 올바르지 않습니다.",
    errorDuplicate: "이미 등록된 이메일입니다.",
    errorNotFound: "계정을 찾을 수 없습니다.",
    progressLabel: "진행 상황",
    accountInfo: "계정 상세 정보",
    save: "카드 저장",
    back: "뒤로",
    currencyLabel: "기본 통화",
    continueGoogle: "Google로 계속하기",
    truthTagline: "진리는 미사여구보다 중요합니다.",
    enter: "들어가기",
    sendResetLink: "재설정 링크 전송",
    forgotPassword: "비밀번호를 잊으셨나요?",
    countSuffix: "개의 비전",
    profileSaveError: "저장에 실패했습니다.",
    profileSaveSuccess: "프로필이 업데이트되었습니다.",
    open: "열기",
    paywallTitle: "비전 잠금 해제",
    paywallTitleUnlocked: "잠금 해제됨",
    paywallDesc: "Hazon 운영을 유지하고 당신의 여정을 지원하기 위한 소액의 후원.",
    paywallPrice: "$3.00",
    paywallAction: "잠금 해제",
    preparingPayment: "안전한 결제 준비 중...",
    generatingTitle: "비전 생성 중...",
    generatingDesc: "Hazon이 당신의 성찰을 성경적인 문서로 종합하고 있습니다.",
    confSignupTitle: "받은 편지함 확인",
    confSignupDesc: "계정이 생성되었습니다. 이메일을 확인하세요.",
    confForgotTitle: "받은 편지함 확인",
    confForgotDesc: "복구 링크를 전송했습니다.",
    notFoundTitle: "404 - 찾을 수 없음",
    notFoundDesc: "찾으시는 경로가 존재하지 않습니다.",
    returnLibrary: "라이브러리로 돌아가기",
    drafts: "초안",
    completed: "완료됨",
    retry: "재시도",
    errorFetch: "연결에 실패했습니다.",
    paymentCancelled: "결제가 완료되지 않았습니다.",
    verificationFailed: "결제 확인에 실패했습니다.",
    initPaymentFailed: "결제 초기화에 실패했습니다.",
    verifyingPayment: "결제 확인 중...",
    paymentSettings: "결제 수단",
    addCard: "새 카드 추가",
    cardName: "카드 소유자 이름",
    cardNumber: "카드 번호",
    expiryDate: "만료일 (MM/YY)",
    cvv: "CVV",
    remove: "삭제",
    noCards: "저장된 카드가 없습니다.",
    stopMic: "중지",
    listening: "듣는 중...",
    aboutTitle: "HAZON에 관하여",
    aboutSubtitle1: "Hazon은 성경적 분별의 동반자입니다.",
    aboutPara1Sub: "우리의 생각이 하나님의 지혜와 일치할 때 명확함이 드러납니다.",
    aboutSubtitle2: "분별을 위한 동반자",
    aboutPara2Sub: "Hazon은 당신이 방향을 찾을 때 함께 걷습니다.",
    aboutSubtitle3: "성경에 의한 인도",
    aboutPara3Sub: "Hazon은 생각을 정리하도록 돕습니다.",
    aboutSubtitle4: "탐구자와 신자를 위해",
    aboutPara4Sub: "Hazon은 지혜로의 초대입니다.",
    aboutScripture1: "묵시가 없으면 백성이 방자히 행하거니와 — 잠언 29:18",
    aboutScripture2: "너는 이 묵시를 기록하여 판에 명백히 새기되 달려가면서도 읽을 수 있게 하라 — 하박국 2:2",
    howItWorksTitle: "작동 원리",
    step1: "성찰",
    step1Desc: "마음에 있는 것을 솔직하게 말씀하세요.",
    step2: "분별",
    step2Desc: "성경적 지혜를 통해 명확함을 얻으세요.",
    step3: "시각화",
    step3Desc: "명확한 비전을 받으세요.",
    getStartedTitle: "명확함을 찾을 준비가 되셨나요?",
    getStartedButton: "여정 시작하기",
    evangelismTitle: "기독교인이 아니신가요? 여기서 시작하세요.",
    evangelismPhilosophy: "Hazon 철학",
    evangelismPrayerSubtitle: "그리스도를 영접하는 기도",
    evangelismDesc: "Hazon은 예수 그리스도가 길이요 진리요 생명이라는 진리에 기초합니다.",
    evangelismSub: "당신의 죄와 상관없이 이 구원을 받을 수 있습니다.",
    evangelismPrayerTitle: "신앙의 기도",
    evangelismPrayer: "하늘에 계신 아버지,\n저는 당신을 떠나 살았음을 고백합니다...",
    savedByGrace: "당신은 이제 예수 그리스도를 믿음으로 말미암아 은혜로 구원을 받았습니다.",
    copyright: "Hazon | 명확한 비전",
    language: "언어",
    supportHazon: "Hazon 후원하기",
    improvementSuggestions: "개선 제안",
    contribute: "후원하기"
  },
  sw: {
    login: "INGIA", signup: "JISAJILI", emailLabel: "Barua pepe", passwordLabel: "Nywila", nameLabel: "Jina",
    newVision: "MAONO MAPYA", library: "MAKTABA", profile: "Wasifu", logout: "ONDOKA", 
    reflecting: "Tunaakisi...", generateVision: "TENGENEZA WARAKA WA MAONO",
    download: "HIFADHI KAMA PICHA", clearVision: "MAONO YAWAZI.", beginJourney: "ANZA HAPA",
    tagline: "Njia rahisi ya kupata uwazi na kupanga hatua zako zinazofuata kwa kutumia Neno la Mungu.",
    visions: "Maono Yako", noVisions: "HAKUNA MAONO YALIYOPATIKANA.", backToLogin: "RUDI KWENYE KUINGIA", createAccount: "TENGENEZA AKAUNTI",
    reflectHere: "Shiriki mawazo yako...", readyForSynthesis: "tayari kwa utengenezaji",
    finalizePrompt: "Umepata uwazi. Je, ungependa kutengeneza waraka wako wa maono sasa?",
    errorGeneric: "Kuna kitu kimeenda vibaya. Tafadhali angalia muunganisho wako.",
    errorAuth: "Barua pepe au nywila uliyoweka si sahihi.",
    errorDuplicate: "Akaunti yenye barua pepe hii tayari ipo.",
    errorNotFound: "Hakuna akaunti iliyopatikana kwa barua pepe hii.",
    progressLabel: "MAENDELEO",
    accountInfo: "MAELEZO YA AKAUNTI",
    save: "HIFADHI KADI",
    back: "Rudi",
    currencyLabel: "Sarafu Unayopendelea",
    continueGoogle: "Endelea na Google",
    truthTagline: "UKWELI NI MUHIMU KULIKO MANENO YALIYOPAMBWA.",
    enter: "INGIA",
    sendResetLink: "TUMA KIUNGO CHA KUWEKA UPYA",
    forgotPassword: "UMESAHAU NYWILA?",
    countSuffix: "MAONO",
    profileSaveError: "Imeshindwa kuhifadhi wasifu.",
    profileSaveSuccess: "Wasifu wako umesasishwa.",
    open: "Fungua",
    paywallTitle: "Fungua Maono Yako",
    paywallTitleUnlocked: "Maono Yamefunguliwa",
    paywallDesc: "Mchango mdogo wa kuwezesha Hazon kuendelea na kusaidia safari yako.",
    paywallPrice: "$3.00",
    paywallAction: "Fungua Maono",
    preparingPayment: "Tunaandaa malipo salama...",
    generatingTitle: "Tunatengeneza maono yako...",
    generatingDesc: "Hazon inaunganisha tafakari zako kuwa waraka wa kibiblia.",
    confSignupTitle: "Angalia Kikasha chako",
    confSignupDesc: "Akaunti yako imetengenezwa. Angalia barua pepe yako.",
    confForgotTitle: "Angalia Kikasha chako",
    confForgotDesc: "Kiungo cha kurejesha kimetumwa.",
    notFoundTitle: "404 - Maono Hayajapatikana",
    notFoundDesc: "Njia unayotafuta haipo.",
    returnLibrary: "RUDI KWENYE MAKTABA",
    drafts: "Rasimu",
    completed: "Imekamilika",
    retry: "JARIBU TENA",
    errorFetch: "Muunganisho umeshindwa.",
    paymentCancelled: "Malipo hayajakamilika.",
    verificationFailed: "Malipo hayakuweza kuthibitishwa.",
    initPaymentFailed: "Tumeshindwa kuanzisha malipo.",
    verifyingPayment: "Tunathibitisha malipo yako...",
    paymentSettings: "Njia za Malipo",
    addCard: "Ongeza Kadi Mpya",
    cardName: "Jina la Mwenye Kadi",
    cardNumber: "Namba ya Kadi",
    expiryDate: "Tarehe ya Kumalizika (MM/YY)",
    cvv: "CVV",
    remove: "Ondoa",
    noCards: "Hakuna kadi zilizohifadhiwa.",
    stopMic: "ACHA",
    listening: "Tunasikiliza...",
    aboutTitle: "KUHUSU HAZON",
    aboutSubtitle1: "Hazon ni mwandani wa utambuzi wa kibiblia.",
    aboutPara1Sub: "Uwazi hufunuliwa wakati mawazo yetu yanapopatana na hekima ya Mungu.",
    aboutSubtitle2: "Mwandani wa Utambuzi",
    aboutPara2Sub: "Hazon hutembea nawe unapotafuta mwelekeo.",
    aboutSubtitle3: "Inaongozwa na Maandiko",
    aboutPara3Sub: "Hazon husaidia kuleta mpangilio katika mawazo yako.",
    aboutSubtitle4: "Kwa Watafutaji na Waumini",
    aboutPara4Sub: "Hazon ni mwaliko wa hekima.",
    aboutScripture1: "Pasipo maono, watu huacha kujizuia. — Mithali 29:18",
    aboutScripture2: "Andika maono hayo... ili asomaye apate kuitangaza. — Habakuki 2:2",
    howItWorksTitle: "JINSI INAVYOFANYA KAZI",
    step1: "Tafakari",
    step1Desc: "Zungumza kwa unyoofu kuhusu yaliyo moyoni mwako.",
    step2: "Tambua",
    step2Desc: "Pata uwazi kupitia hekima ya kibiblia.",
    step3: "Ona",
    step3Desc: "Pokea maono yaliyo wazi.",
    getStartedTitle: "Uko tayari kwa uwazi?",
    getStartedButton: "ANZA SAFARI YANGU",
    evangelismTitle: "SI MKRISTO? ANZA HAPA.",
    evangelismPhilosophy: "Falsafa ya Hazon",
    evangelismPrayerSubtitle: "Sala ya kumpokea Kristo",
    evangelismDesc: "Hazon imejengwa juu ya ukweli kwamba Yesu Kristo ndiye Njia.",
    evangelismSub: "Unaweza kupokea hili bila kujali dhambi zako.",
    evangelismPrayerTitle: "Sala ya Imani",
    evangelismPrayer: "Baba wa Mbinguni,\nNinakiri kwamba nimeishi mbali nawe...",
    savedByGrace: "Sasa umeokolewa kwa neema kupitia imani katika Yesu Kristo.",
    copyright: "Hazon | Maono ya Wazi",
    language: "Lugha",
    supportHazon: "Saidia Hazon",
    improvementSuggestions: "Mapendekezo ya Maboresho",
    contribute: "Changia"
  },
  tr: {
    login: "GİRİŞ YAP", signup: "KAYIT OL", emailLabel: "E-posta", passwordLabel: "Şifre", nameLabel: "İsim",
    newVision: "YENİ VİZYON", library: "KÜTÜPHANE", profile: "Profil", logout: "ÇIKIŞ YAP", 
    reflecting: "Düşünülüyor...", generateVision: "VİZYON BELGESİ OLUŞTUR",
    download: "RESİM OLARAK KAYDET", clearVision: "NET BİR VİZYON.", beginJourney: "BURADAN BAŞLAYIN",
    tagline: "Tanrı'nın Sözü'nü kullanarak netlik bulmanın ve sonraki adımlarınızı planlamanın basit bir yolu.",
    visions: "Vizyonlarınız", noVisions: "VİZYON BULUNAMADI.", backToLogin: "GİRİŞE DÖN", createAccount: "HESAP OLUŞTUR",
    reflectHere: "Düşüncelerinizi paylaşın...", readyForSynthesis: "oluşturmaya hazır",
    finalizePrompt: "Netlik buldunuz. Vizyon belgenizi şimdi oluşturmak ister misiniz?",
    errorGeneric: "Bir şeyler ters gitti. Lütfen bağlantınızı kontrol edin.",
    errorAuth: "Girdiğiniz e-posta veya şifre yanlış.",
    errorDuplicate: "bu e-posta ile bir hesap zaten mevcut.",
    errorNotFound: "Bu e-posta adresiyle bir hesap bulunamadı.",
    progressLabel: "İLERLEME",
    accountInfo: "HESAP DETAYLARI",
    save: "KARTI KAYDET",
    back: "Geri",
    currencyLabel: "Tercih Edilen Para Birimi",
    continueGoogle: "Google ile Devam Et",
    truthTagline: "GERÇEK, SÜSLÜ SÖZLERDEN DAHA ÖNEMLİDİR.",
    enter: "GİRİŞ",
    sendResetLink: "SIFIRLAMA BAĞLANTISI GÖNDER",
    forgotPassword: "ŞİFREMİ UNUTTUM?",
    countSuffix: "VİZYON",
    profileSaveError: "Profil kaydedilemedi.",
    profileSaveSuccess: "Profiliniz güncellendi.",
    open: "Aç",
    paywallTitle: "Vizyonunuzun Kilidini Açın",
    paywallTitleUnlocked: "Vizyon Kilidi Açıldı",
    paywallDesc: "Hazon'un devam etmesini sağlamak ve yolculuğunuzu desteklemek için küçük bir katkı.",
    paywallPrice: "$3.00",
    paywallAction: "Kilidi Aç",
    preparingPayment: "Güvenli ödeme hazırlanıyor...",
    generatingTitle: "Vizyonunuz oluşturuluyor...",
    generatingDesc: "Hazon, düşüncelerinizi İncil temelli bir belgede sentezliyor.",
    confSignupTitle: "Gelen Kutunuzu Kontrol Edin",
    confSignupDesc: "Hesabınız oluşturuldu. E-postanızı kontrol edin.",
    confForgotTitle: "Gelen Kutunuzu Kontrol Edin",
    confForgotDesc: "Kurtarma bağlantısı gönderildi.",
    notFoundTitle: "404 - Vizyon Bulunamadı",
    notFoundDesc: "Aradığınız yol mevcut değil.",
    returnLibrary: "KÜTÜPHANEYE DÖN",
    drafts: "Taslaklar",
    completed: "Tamamlandı",
    retry: "TEKRAR DENE",
    errorFetch: "Bağlantı hatası.",
    paymentCancelled: "Ödeme tamamlanmadı.",
    verificationFailed: "Ödeme doğrulanamadı.",
    initPaymentFailed: "Ödeme başlatılamadı.",
    verifyingPayment: "Ödemeniz doğrulanıyor...",
    paymentSettings: "Ödeme Yöntemleri",
    addCard: "Yeni Kart Ekle",
    cardName: "Kart Sahibi",
    cardNumber: "Kart Numarası",
    expiryDate: "Son Kullanma (AA/YY)",
    cvv: "CVV",
    remove: "Kaldır",
    noCards: "Kayıtlı kart yok.",
    stopMic: "DURDUR",
    listening: "Dinleniyor...",
    aboutTitle: "HAZON HAKKINDA",
    aboutSubtitle1: "Hazon, İncil temelli bir ayırt etme yoldaşıdır.",
    aboutPara1Sub: "Düşüncelerimiz Tanrı'nın bilgeliğiyle uyumlu olduğunda netlik ortaya çıkar.",
    aboutSubtitle2: "Ayırt Etme İçin Bir Yoldaş",
    aboutPara2Sub: "Hazon, yön ararken yanınızda yürür.",
    aboutSubtitle3: "Kutsal Yazı Rehberliğinde",
    aboutPara3Sub: "Hazon, düşüncelerinize düzen getirmeye yardımcı olur.",
    aboutSubtitle4: "Arayanlar ve İnananlar İçin",
    aboutPara4Sub: "Hazon, bilgeliğe bir davettir.",
    aboutScripture1: "Görüm olmayan yerde halk dizginsizleşir. — Özdeyişler 29:18",
    aboutScripture2: "Görümü yaz... öyle ki okuyan hızla geçebilsin. — Habakkuk 2:2",
    howItWorksTitle: "NASIL ÇALIŞIR",
    step1: "Düşün",
    step1Desc: "Kalbinizdekiler hakkında dürüstçe konuşun.",
    step2: "Ayırt Et",
    step2Desc: "İncil bilgeliğiyle netlik kazanın.",
    step3: "Görselleştir",
    step3Desc: "Net bir vizyon edinin.",
    getStartedTitle: "Netliğe hazır mısınız?",
    getStartedButton: "YOLCULUĞUMA BAŞLA",
    evangelismTitle: "HRİSTİYAN DEĞİL MİSİNİZ? BURADAN BAŞLAYIN.",
    evangelismPhilosophy: "Hazon Felsefesi",
    evangelismPrayerSubtitle: "Mesih'i kabul etmek için bir dua",
    evangelismDesc: "Hazon, İsa Mesih'in Yol, Gerçek ve Yaşam olduğu gerçeğine dayanır.",
    evangelismSub: "Günahlarınız ne olursa olsun bunu kabul edebilirsiniz.",
    evangelismPrayerTitle: "İman Duası",
    evangelismPrayer: "Göklerdeki Babamız,\nSenden uzak yaşadığımı itiraf ediyorum...",
    savedByGrace: "Artık İsa Mesih'e iman yoluyla lütufla kurtuldunuz.",
    copyright: "Hazon | Net Bir Vizyon",
    language: "Dil",
    supportHazon: "Hazon'u Destekle",
    improvementSuggestions: "İyileştirme Önerileri",
    contribute: "Katkıda Bulun",
    supportDesc: "Desteğiniz Hazon'un çalışmaya devam etmesine yardımcı oluyor ve dünya çapındaki arayışçılara ve inananlara yardım etmemizi sağlıyor. Her katkı, yön arayanlara Tanrı merkezli netlik getirme misyonuna yapılan bir yatırımdır.",
    amount: "MİKTAR",
    minContribution: "Lütfen $1 veya daha fazla bir katkı girin."
  },
  id: {
    login: "MASUK", signup: "DAFTAR", emailLabel: "Email", passwordLabel: "Kata Sandi", nameLabel: "Nama",
    newVision: "VISI BARU", library: "PERPUSTAKAAN", profile: "Profil", logout: "KELUAR", 
    reflecting: "Merefleksikan...", generateVision: "BUAT DOKUMEN VISI",
    download: "SIMPAN SEBAGAI GAMBAR", clearVision: "VISI YANG JELAS.", beginJourney: "MULAI DI SINI",
    tagline: "Cara sederhana untuk menemukan kejelasan dan merencanakan langkah Anda selanjutnya menggunakan Firman Tuhan.",
    visions: "Visi Anda", noVisions: "VISI TIDAK DITEMUKAN.", backToLogin: "KEMBALI KE LOGIN", createAccount: "BUAT AKUN",
    reflectHere: "Bagikan pemikiran Anda...", readyForSynthesis: "siap untuk pembuatan",
    finalizePrompt: "Anda telah menemukan kejelasan. Apakah Anda ingin membuat dokumen visi sekarang?",
    errorGeneric: "Terjadi kesalahan. Silakan periksa koneksi Anda.",
    errorAuth: "Email atau kata sandi yang Anda masukkan salah.",
    errorDuplicate: "Akun dengan email ini sudah ada.",
    errorNotFound: "Tidak ada akun yang ditemukan dengan email ini.",
    progressLabel: "KEMAJUAN",
    accountInfo: "DETAIL AKUN",
    save: "SIMPAN KARTU",
    back: "Kembali",
    currencyLabel: "Mata Uang Pilihan",
    continueGoogle: "Lanjutkan dengan Google",
    truthTagline: "KEBENARAN LEBIH PENTING DARIPADA KATA-KATA INDAH.",
    enter: "MASUK",
    sendResetLink: "KIRIM LINK RESET",
    forgotPassword: "LUPA KATA SANDI?",
    countSuffix: "VISI",
    profileSaveError: "Gagal menyimpan profil.",
    profileSaveSuccess: "Profil Anda telah diperbarui.",
    open: "Buka",
    paywallTitle: "Buka Visi Anda",
    paywallTitleUnlocked: "Visi Terbuka",
    paywallDesc: "Kontribusi kecil untuk menjaga Hazon tetap berjalan dan mendukung perjalanan Anda.",
    paywallPrice: "$3.00",
    paywallAction: "Buka Visi",
    preparingPayment: "Menyiapkan pembayaran aman...",
    generatingTitle: "Menghasilkan visi Anda...",
    generatingDesc: "Hazon mensintesis refleksi Anda menjadi dokumen alkitabiah.",
    confSignupTitle: "Periksa Kotak Masuk Anda",
    confSignupDesc: "Akun Anda telah dibuat. Periksa email Anda.",
    confForgotTitle: "Periksa Kotak Masuk Anda",
    confForgotDesc: "Link pemulihan telah dikirim.",
    notFoundTitle: "404 - Visi Tidak Ditemukan",
    notFoundDesc: "Jalur yang Anda cari tidak ada.",
    returnLibrary: "KEMBALI KE PERPUSTAKAAN",
    drafts: "Draf",
    completed: "Selesai",
    retry: "COBA LAGI",
    errorFetch: "Koneksi gagal.",
    paymentCancelled: "Pembayaran tidak selesai.",
    verificationFailed: "Pembayaran tidak dapat diverifikasi.",
    initPaymentFailed: "Gagal memulai pembayaran.",
    verifyingPayment: "Memverifikasi pembayaran Anda...",
    paymentSettings: "Metode Pembayaran",
    addCard: "Tambah Kartu Baru",
    cardName: "Nama Pemegang Kartu",
    cardNumber: "Nomor Kartu",
    expiryDate: "Masa Berlaku (MM/YY)",
    cvv: "CVV",
    remove: "Hapus",
    noCards: "Tidak ada kartu yang tersimpan.",
    stopMic: "BERHENTI",
    listening: "Mendengarkan...",
    aboutTitle: "TENTANG HAZON",
    aboutSubtitle1: "Hazon adalah pendamping penegasan alkitabiah.",
    aboutPara1Sub: "Kejelasan terungkap ketika pemikiran kita selaras dengan hikmat Tuhan.",
    aboutSubtitle2: "Pendamping untuk Penegasan",
    aboutPara2Sub: "Hazon berjalan bersama Anda saat Anda mencari arah.",
    aboutSubtitle3: "Dibimbing oleh Alkitab",
    aboutPara3Sub: "Hazon membantu menertibkan pikiran Anda.",
    aboutSubtitle4: "Untuk Pencari dan Orang Percaya",
    aboutPara4Sub: "Hazon adalah undangan menuju hikmat.",
    aboutScripture1: "Bila tidak ada wahyu, liarlah rakyat. — Amsal 29:18",
    aboutScripture2: "Tuliskanlah penglihatan itu... supaya orang yang membacanya dapat berlari. — Habakuk 2:2",
    howItWorksTitle: "CARA KERJA",
    step1: "Refleksi",
    step1Desc: "Bicaralah dengan jujur tentang apa yang ada di hati Anda.",
    step2: "Penegasan",
    step2Desc: "Dapatkan kejelasan melalui hikmat alkitabiah.",
    step3: "Visualisasi",
    step3Desc: "Terima visi yang jelas.",
    getStartedTitle: "Siap untuk kejelasan?",
    getStartedButton: "MULAI PERJALANAN SAYA",
    evangelismTitle: "BUKAN KRISTEN? MULAI DI SINI.",
    evangelismPhilosophy: "Filosofi Hazon",
    evangelismPrayerSubtitle: "Doa untuk menerima Kristus",
    evangelismDesc: "Hazon didasarkan pada kebenaran bahwa Yesus Kristus adalah Jalan.",
    evangelismSub: "Anda dapat menerima ini terlepas dari dosa-dosa Anda.",
    evangelismPrayerTitle: "Doa Iman",
    evangelismPrayer: "Bapa Surgawi,\nSaya mengakui bahwa saya telah hidup jauh dari-Mu...",
    savedByGrace: "Anda sekarang diselamatkan oleh anugerah melalui iman kepada Yesus Kristus.",
    copyright: "Hazon | Visi yang Jelas",
    language: "Bahasa",
    supportHazon: "Dukung Hazon",
    improvementSuggestions: "Saran Perbaikan",
    contribute: "Berkontribusi",
    supportDesc: "Dukungan Anda membantu kami menjaga Hazon tetap berjalan, memungkinkan kami membantu para pencari dan orang percaya di seluruh dunia. Setiap kontribusi adalah investasi dalam misi membawa kejelasan yang berpusat pada Tuhan kepada mereka yang mencari arah.",
    amount: "JUMLAH",
    minContribution: "Silakan masukkan kontribusi sebesar $1 atau lebih."
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getTagStyles = (state: DiscernmentState) => {
  switch (state) {
    case DiscernmentState.VISION_SEED: return { label: "BEGINNING", bg: "bg-blue-100", text: "text-blue-700" };
    case DiscernmentState.DISCERNMENT_LOOP: return { label: "EXPLORING", bg: "bg-orange-100", text: "text-orange-700" };
    case DiscernmentState.CLARITY_CHECK: return { label: "CLARIFYING", bg: "bg-purple-100", text: "text-purple-700" };
    case DiscernmentState.VISION_SYNTHESIS: return { label: "DEVELOPING", bg: "bg-yellow-100", text: "text-yellow-700" };
    case DiscernmentState.COMPLETE: return { label: "COMPLETE", bg: "bg-emerald-100", text: "text-emerald-700" };
    default: return { label: state, bg: "bg-gray-100", text: "text-gray-500" };
  }
};

const UIAlert: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-fade">
    <div className="bg-black text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
      <p className="text-sm font-medium pr-4">{message}</p>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isVisionsLoading, setIsVisionsLoading] = useState(false);
  const [view, setView] = useState<AppView>('landing');
  const [sessions, setSessions] = useState<VisionSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VisionSession | null>(null);
  const [confData, setConfData] = useState({ title: '', desc: '' });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('hazon_cards');
    return saved ? JSON.parse(saved) : [];
  });
  const handleVerifyPayment = async (reference: string, visionId: string) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/verify-paystack-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: "verify",
          amount: 300,
          vision_id: visionId,
          reference: reference,
        }),
      }
    );
    const data = await response.json();

    if (!data.status) throw new Error(data.message || t.verificationFailed);

    window.history.replaceState({}, document.title, window.location.pathname);


    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadAppData(session.user);
      // To'langan visionni avtomatik ochish
      const { data: visionData } = await supabase
        .from('visions')
        .select('*')
        .eq('id', visionId)
        .single();
      if (visionData) {
        const mapped = {
          id: visionData.id.toString(),
          title: visionData.title,
          date: formatDate(visionData.created_at),
          state: visionData.status,
          messages: visionData.chat_session || [],
          document: typeof visionData.generated_vision === 'string' 
          ? JSON.parse(visionData.generated_vision) 
          : visionData.generated_vision || null,
          unlocked: true,
          is_paid: true,
          language: visionData.language
        };
        setCurrentSession(mapped);
        setView('session');
      }
    }
      } catch (err: any) {
        setGlobalError(err.message || t.errorGeneric);
      }
    };
  useEffect(() => {
    localStorage.setItem('hazon_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setView('dashboard');
          loadAppData(session.user);
        }
      } catch (err) {
        setGlobalError(t.errorFetch);
      }
    };
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (user?.id !== session.user.id) {
          setUser(session.user);
          setView('dashboard');
          loadAppData(session.user);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        if (view !== 'landing' && view !== 'auth') setView('landing');
      }
    });

    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    const visionId = params.get('vision_id');



    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    const visionId = params.get('vision_id');

    if (reference && visionId) {
      setTimeout(() => handleVerifyPayment(reference, visionId), 1000);
    }
  }, [user]);

  



  const loadAppData = async (currentUser: any) => {
    setIsVisionsLoading(true);
    try {
      await ensureUserProfile(currentUser);
      await Promise.all([loadUserProfile(currentUser.id), loadVisions(currentUser.id)]);
    } catch (err) {
      setGlobalError(t.errorFetch);
    } finally {
      setIsVisionsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    const { data } = await supabase.from('app_users').select('*').eq('id', userId).maybeSingle();
    if (data) setUserProfile(data);
  };

  const loadVisions = async (userId: string) => {
    const { data, error } = await supabase.from('visions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = data.map((d: any) => ({
        id: d.id.toString(),
        title: d.title,
        date: formatDate(d.created_at),
        state: d.status as DiscernmentState,
        messages: d.chat_session || [], 
        document: d.generated_vision 
        ? (typeof d.generated_vision === 'string' 
          ? JSON.parse(d.generated_vision) 
          : d.generated_vision)
        : null,
        unlocked: d.is_paid || false,
        is_paid: d.is_paid || false,
        language: d.language
      }));
      
      setSessions(mapped);
      
      if (currentSession) {
        const updated = mapped.find(s => s.id === currentSession.id);
        if (updated) {
          setCurrentSession(updated);
          if (updated.language) setLang(updated.language as Language);
        }
      }
    }
  };

  const startNewSession = async () => {
    if (!user) return;
    try {
      const visionData = await createVisionInDB("New Journey", DiscernmentState.VISION_SEED, lang);
      const newSession: VisionSession = {
        id: visionData.id.toString(),
        title: "New Journey",
        date: formatDate(new Date().toISOString()),
        state: DiscernmentState.VISION_SEED,
        messages: [],
        document: null,
        unlocked: false,
        is_paid: false,
        language: lang
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setView('session');
    } catch (err: any) {
      setGlobalError(t.errorGeneric);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSessions([]);
      setCurrentSession(null);
      setView('landing');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

const onOpenSession = (s: VisionSession) => {
  setCurrentSession(s);
  if (s.language) setLang(s.language as Language);
  if (s.state === DiscernmentState.COMPLETE) {
    if (s.unlocked || s.is_paid) {
      setView('session');
    } else {
      supabase.from('visions').select('is_paid').eq('id', s.id).single().then(({ data }) => {
        if (data?.is_paid) {
          setCurrentSession({ ...s, is_paid: true, unlocked: true });
          setView('session');
        } else {
          setView('paywall');
        }
      });
    }
  } else {
    setView('session');
  }
};
  const handleGenerationComplete = (doc: VisionDocument) => {
    if (!currentSession) return;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
        ? { ...s, document: doc, state: DiscernmentState.COMPLETE, title: doc.title } 
        : s
    ));
    
    setCurrentSession({ 
      ...currentSession, 
      document: doc, 
      is_paid: false, 
      state: DiscernmentState.COMPLETE,
      title: doc.title
    });
    
    setView('paywall');
  };

  const addCard = (card: CreditCard) => setCards(prev => [...prev, card]);
  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] selection:bg-black selection:text-white font-sans antialiased overflow-x-hidden">
      {globalError && <UIAlert message={globalError} onDismiss={() => setGlobalError(null)} />}
      
      {view !== 'auth' && view !== 'landing' && view !== 'generating' && view !== 'paywall' && view !== 'confirmation' && view !== 'notFound' && (
        <Header view={view} isLoggedIn={!!user} onLibraryClick={() => setView('dashboard')} onProfileClick={() => setView('profile')} t={t} />
      )}
      
      <main className={(view === 'auth' || view === 'landing' || view === 'generating' || view === 'paywall' || view === 'confirmation' || view === 'notFound') ? '' : "pt-24 md:pt-36 pb-0"}>
        {view === 'landing' && <LandingPage onProceed={() => setView('auth')} t={t} setLang={setLang} lang={lang} />}
        {view === 'auth' && <AuthScreen onAuth={(u) => { setUser(u); setView('dashboard'); }} onConfirm={(title, desc) => { setConfData({ title, desc }); setView('confirmation'); }} onError={setGlobalError} t={t} />}
        {view === 'dashboard' && <Dashboard sessions={sessions} isLoading={isVisionsLoading} onNewSession={startNewSession} onOpenSession={onOpenSession} t={t} />}
        {view === 'session' && currentSession && <SessionView session={currentSession} userName={userProfile?.full_name || "USER"} onBack={() => { loadVisions(user.id); setView('dashboard'); }} onStartGen={() => setView('generating')} onError={setGlobalError} t={t} lang={lang} />}
        {view === 'generating' && currentSession && <GeneratingView session={currentSession} onComplete={handleGenerationComplete} onBack={() => setView('session')} onError={setGlobalError} t={t} lang={lang} />}
        {view === 'paywall' && currentSession && user && 
          <VisionUnlock 
            visionId={currentSession.id} 
            userEmail={user.email} 
            onBack={() => setView('dashboard')} 
            onSuccess={() => {
              setCurrentSession(prev => prev ? { ...prev, is_paid: true, unlocked: true } : prev);
              setView('session'); // ✅ 'vision' emas, 'session'!
            }}
            t={t} 
          />
        }
        {view === 'confirmation' && <ConfirmationView title={confData.title} desc={confData.desc} onBack={() => setView('auth')} t={t} />}
        {view === 'notFound' && <NotFoundView onBack={() => setView('dashboard')} t={t} />}
        {view === 'profile' && user && userProfile && <ProfilePage user={user} profile={userProfile} lang={lang} setLang={setLang} onBack={() => setView('dashboard')} onLogout={handleLogout} onPayments={() => setView('payments')} t={t} />}
        {view === 'payments' && <PaymentsSettings cards={cards} onAddCard={addCard} onRemoveCard={removeCard} onBack={() => setView('profile')} t={t} />}
      </main>
    </div>
  );
};

const Header: React.FC<{ view: AppView, isLoggedIn: boolean, onLibraryClick: () => void, onProfileClick: () => void, t: any }> = ({ view, isLoggedIn, onLibraryClick, onProfileClick, t }) => (
  <header className="fixed top-0 left-0 w-full h-20 md:h-32 bg-[#F5F5F3]/90 backdrop-blur-md z-[100] px-6 md:px-12 flex items-center justify-center space-x-4 md:space-x-8 border-b border-black/5">
    <div className="flex-1 flex justify-start">
      {isLoggedIn && view !== 'dashboard' && <button onClick={onLibraryClick} className="text-[9px] md:text-xs uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity font-bold">{t.library}</button>}
    </div>
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl md:text-4xl serif tracking-tighter leading-none mb-0.5 font-normal cursor-pointer" onClick={onLibraryClick}>Hazon</h1>
      <p className="text-[6px] md:text-[8px] uppercase tracking-[0.4em] opacity-30 font-bold">{t.clearVision}</p>
    </div>
    <div className="flex-1 flex justify-end">
      {isLoggedIn && <button onClick={onProfileClick} className="text-[9px] md:text-xs uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity font-bold">{t.profile}</button>}
    </div>
  </header>
);

const LandingPage: React.FC<{ onProceed: () => void, t: any, setLang: (l: Language) => void, lang: Language }> = ({ onProceed, t, setLang, lang }) => {
  const [langOpen, setLangOpen] = useState(false);
  
  const languages: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'de', name: 'Deutsch' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'id', name: 'Bahasa Indonesia' }
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F5F3] selection:bg-black selection:text-[#F5F5F3] overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="w-full flex justify-between items-center p-6 md:px-12 md:py-8 animate-fade sticky top-0 bg-[#F5F5F3]/80 backdrop-blur-md z-50">
        <div className="relative">
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className="text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2"
          >
            {languages.find(l => l.code === lang)?.name}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${langOpen ? 'rotate-180' : ''}`}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {langOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden min-w-[120px] animate-fade">
              {languages.map(l => (
                <button 
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#F5F5F3] transition-colors ${lang === l.code ? 'bg-black text-white' : 'opacity-40'}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={onProceed} 
          className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold opacity-50 hover:opacity-100 transition-all"
        >
          {t.login}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="h-[90vh] flex flex-col items-center justify-center px-6 text-center max-w-7xl mx-auto relative">
        <div className="animate-fade flex flex-col items-center">
          <p className="text-[9px] md:text-[11px] uppercase tracking-[0.6em] opacity-40 font-bold mb-3">{t.clearVision}</p>
          <h1 className="text-7xl md:text-[9rem] serif tracking-tighter leading-none font-normal">Hazon</h1>
          <p className="max-w-[280px] md:max-w-md mx-auto serif italic text-base md:text-xl opacity-60 leading-relaxed font-light mt-6">
            {t.tagline}
          </p>
          
          <div className="pt-10">
            <button 
              onClick={onProceed} 
              className="bg-black text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95"
            >
              {t.beginJourney}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-8 animate-bounce opacity-20 z-10 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* Clarity Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#F5F5F3] overflow-hidden">
        <div className="max-w-5xl mx-auto animate-fade">
          <div className="bg-black text-white p-10 md:p-20 rounded-[3rem] shadow-2xl transform -rotate-1 md:-rotate-2 hover:rotate-0 transition-transform duration-700">
            <div className="transform rotate-1 md:rotate-2 hover:rotate-0 transition-transform duration-700 space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-3xl md:text-5xl serif font-normal">{t.aboutBlackBoxTitle || "Clarity Through the Word of God"}</h2>
                <p className="text-base md:text-xl opacity-70 font-light max-w-2xl mx-auto leading-relaxed">
                  True clarity is not discovered by striving harder, but by listening more closely to the Spirit of Truth. Scripture teaches that vision is not formed by impulse, but revealed through God’s wisdom.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Proverbs 29:18</p>
                    <h3 className="text-xl md:text-2xl serif italic">“Where there is no vision, the people perish.”</h3>
                  </div>
                  <p className="text-sm md:text-base opacity-60 leading-relaxed font-light">
                    God’s Word makes it clear: without kingdom aligned vision, direction is lost and purpose fades. Vision is not optional, it is essential for a life aligned with Him.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Proverbs 3:5–6</p>
                    <h3 className="text-xl md:text-2xl serif italic">“Trust in the Lord with all your heart...”</h3>
                  </div>
                  <p className="text-sm md:text-base opacity-60 leading-relaxed font-light">
                    True direction begins when we release our own certainty and submit our plans to God’s leading. He will make straight your paths when you acknowledge Him in all your ways.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 text-center">
                <p className="text-base md:text-xl serif italic opacity-80 max-w-3xl mx-auto">
                  Hazon exists to quiet the noise, anchor discernment in Scripture, and help you receive vision that is clear, God-centered, and meant to be lived out with faith and wisdom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-white border-b border-black/5">
        <div className="max-w-5xl mx-auto space-y-20 animate-fade">
          <div className="space-y-4 text-center">
            <p className="text-[9px] uppercase tracking-[0.6em] opacity-40 font-bold mx-auto">{t.aboutTitle}</p>
            <h2 className="text-3xl md:text-5xl serif tracking-tight font-normal">{t.aboutSubtitle1}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <div className="md:col-span-2 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-2xl md:text-3xl serif italic font-normal">{t.aboutSubtitle2}</h3>
                <p className="text-base md:text-lg opacity-50 leading-relaxed font-light">
                  {t.aboutPara2Sub}
                </p>
              </div>
            </div>
            
            <div className="space-y-6 text-center md:text-left">
              <h3 className="text-xl md:text-2xl serif italic font-normal">{t.aboutSubtitle3}</h3>
              <p className="text-sm md:text-base opacity-50 leading-relaxed font-light">
                {t.aboutPara3Sub}
              </p>
            </div>
            
            <div className="space-y-6 text-center md:text-left">
              <h3 className="text-xl md:text-2xl serif italic font-normal">{t.aboutSubtitle4}</h3>
              <p className="text-sm md:text-base opacity-50 leading-relaxed font-light">
                {t.aboutPara4Sub}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#F5F5F3]">
        <div className="max-w-3xl mx-auto space-y-20 animate-fade">
          <p className="text-[9px] uppercase tracking-[0.6em] opacity-40 font-bold text-center">{t.howItWorksTitle}</p>
          
          <div className="relative space-y-24">
            {/* Vertical Line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-black/10 -translate-x-1/2"></div>
            
            {[
              { num: '01', title: t.step1, desc: t.step1Desc, align: 'left' },
              { num: '02', title: t.step2, desc: t.step2Desc, align: 'right' },
              { num: '03', title: t.step3, desc: t.step3Desc, align: 'left' }
            ].map((step, i) => (
              <div key={i} className="relative flex items-start md:items-center gap-12 md:gap-0">
                {/* Desktop Left Side */}
                <div className="hidden md:block flex-1 px-12 text-right">
                  {step.align === 'left' && (
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl serif">{step.title}</h3>
                      <p className="text-sm md:text-base opacity-50 leading-relaxed font-light max-w-sm ml-auto">{step.desc}</p>
                    </div>
                  )}
                </div>
                
                {/* Timeline Dot */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold serif shadow-xl ml-0 md:ml-0">
                  {step.num}
                </div>
                
                {/* Right Side (Mobile & Desktop) */}
                <div className="flex-1 px-0 md:px-12 text-left">
                  <div className={`${step.align === 'right' ? 'block' : 'md:hidden'} space-y-4`}>
                    <h3 className="text-2xl md:text-3xl serif">{step.title}</h3>
                    <p className="text-sm md:text-base opacity-50 leading-relaxed font-light max-w-sm">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evangelism Section */}
      <section className="py-32 md:py-48 px-6 md:px-12 bg-white relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D6CDC2]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/[0.02] rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-10 animate-fade text-center lg:text-left">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.6em] opacity-40 font-bold">{t.evangelismTitle}</p>
              <h2 className="text-4xl md:text-6xl serif leading-tight font-normal">
                True clarity begins with <span className="serif italic">Him</span>.
              </h2>
            </div>
            
            <div className="space-y-6 max-w-xl mx-auto lg:mx-0">
              <p className="text-lg md:text-xl opacity-70 leading-relaxed serif italic">
                {t.evangelismDesc}
              </p>
              <p className="text-sm md:text-base opacity-40 leading-relaxed font-light">
                {t.evangelismSub}
              </p>
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-[#F5F5F3] rounded-full border border-black/5">
                <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t.evangelismPhilosophy}</span>
              </div>
            </div>
          </div>

          <div className="animate-fade">
            <div className="bg-[#F5F5F3] p-8 md:p-16 rounded-[3rem] shadow-2xl shadow-black/[0.03] border border-black/5 relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4 text-center">
                  <h4 className="text-2xl md:text-3xl serif italic tracking-tight">{t.evangelismPrayerSubtitle}</h4>
                  <div className="w-12 h-[1px] bg-black/10 mx-auto"></div>
                </div>

                <div className="text-lg md:text-xl font-sans leading-relaxed opacity-80 whitespace-pre-wrap text-center italic">
                  {t.evangelismPrayer}
                </div>

                <div className="text-center space-y-6 pt-6 border-t border-black/5">
                  <p className="text-xs md:text-sm serif italic opacity-50 max-w-xs mx-auto leading-relaxed">
                    {t.savedByGrace}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.5em] font-bold opacity-30">YOU ARE ALWAYS WELCOME HERE.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section - Black theme */}
      <section className="py-24 md:py-48 px-6 md:px-12 bg-black text-white text-center">
        <div className="max-w-3xl mx-auto space-y-12 animate-fade">
          <h2 className="text-4xl md:text-6xl serif tracking-tight font-normal">{t.getStartedTitle}</h2>
          <p className="text-base md:text-xl opacity-60 leading-relaxed font-light max-w-2xl mx-auto">
            {t.getStartedDesc}
          </p>
          <div className="pt-6">
            <button 
              onClick={onProceed} 
              className="bg-white text-black px-12 py-5 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold hover:scale-105 transition-all shadow-xl active:scale-95"
            >
              {t.getStartedButton}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 text-center animate-fade border-t border-black/5 bg-[#F5F5F3]">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-3xl md:text-4xl serif tracking-tighter leading-none font-normal">Hazon</h2>
            <p className="text-[11px] uppercase tracking-[0.5em] font-bold opacity-30">{t.clearVision}</p>
          </div>
          
          <div className="flex gap-8">
            <a href="https://www.instagram.com/hazon.app/" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:scale-110 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com/hazonapp" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:scale-110 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/hazonfaith/" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:scale-110 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>

          <p className="text-[9px] uppercase tracking-[0.5em] font-bold opacity-10">© {new Date().getFullYear()} {t.copyright}</p>
        </div>
      </footer>
    </div>
  );
};

const Dashboard: React.FC<{ sessions: VisionSession[], isLoading: boolean, onNewSession: () => void, onOpenSession: (s: VisionSession) => void, t: any }> = ({ sessions, isLoading, onNewSession, onOpenSession, t }) => {
  const [activeTab, setActiveTab] = useState<'drafts' | 'completed'>('drafts');
  
  const drafts = sessions.filter(s => s.state !== DiscernmentState.COMPLETE);
  const completed = sessions.filter(s => s.state === DiscernmentState.COMPLETE);
  const currentVisions = activeTab === 'drafts' ? drafts : completed;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 animate-fade pb-32">
      <div className="flex justify-center pt-4">
        <div className="inline-flex p-1 bg-white border border-black/5 rounded-full shadow-sm">
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${activeTab === 'drafts' ? 'bg-[#D6CDC2] text-[#6B5E4C] shadow-lg' : 'opacity-40 hover:opacity-70'}`}
          >
            {t.drafts} <span className="ml-2 opacity-50">{drafts.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${activeTab === 'completed' ? 'bg-[#D6CDC2] text-[#6B5E4C] shadow-lg' : 'opacity-40 hover:opacity-70'}`}
          >
            {t.completed} <span className="ml-2 opacity-50">{completed.length}</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl lg:text-6xl serif tracking-tight leading-none font-normal">{t.visions}</h2>
          <p className="text-[11px] md:text-[14px] uppercase tracking-[0.4em] opacity-30 font-bold">{sessions.length} {t.countSuffix}</p>
        </div>
        <button onClick={onNewSession} className="hidden md:block bg-black text-white px-8 py-4 md:px-14 md:py-6 rounded-full text-[10px] md:text-[14px] uppercase tracking-[0.4em] font-bold hover:bg-black/80 transition-all shrink-0 ml-4">
          {t.newVision}
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-black/5 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[11px] uppercase tracking-widest opacity-20 font-bold">RESTORING LIBRARY...</p>
        </div>
      ) : currentVisions.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-black/5 rounded-3xl">
          <p className="text-[11px] md:text-[14px] uppercase tracking-[0.4em] opacity-30 font-bold">{t.noVisions}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 pb-10">
          {currentVisions.map(s => <VisionCard key={s.id} session={s} onOpen={() => onOpenSession(s)} t={t} />)}
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 w-full p-6 pb-10 bg-[#F5F5F3]/80 backdrop-blur-xl z-[60] border-t border-black/5 flex justify-center items-center">
        <div className="w-full max-w-xs">
          <button 
            onClick={onNewSession} 
            className="bg-black text-white px-12 py-5 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl shadow-black/20 w-full active:scale-95 transition-transform"
          >
            {t.newVision}
          </button>
        </div>
      </div>
    </div>
  );
};

const VisionCard: React.FC<{ session: VisionSession, onOpen: () => void, t: any }> = ({ session, onOpen, t }) => {
  const styles = getTagStyles(session.state);
  const lastMessage = session.messages.length > 0 ? session.messages[session.messages.length - 1].text : '';
  const displaySnippet = session.document?.summary || lastMessage;
  const snippet = displaySnippet.slice(0, 100) + (displaySnippet.length > 100 ? '...' : '');

  return (
    <div 
      onClick={onOpen} 
      className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-black/10 transition-all duration-300 cursor-pointer group flex flex-col h-full bg-clip-padding"
      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
    >
      <div className="flex justify-between items-start mb-6">
        <span className={`px-4 py-1.5 rounded-full text-[8px] font-bold tracking-[0.2em] ${styles.bg} ${styles.text}`}>
          {styles.label}
        </span>
        <span className="text-[9px] opacity-20 font-bold uppercase tracking-widest">{session.date}</span>
      </div>
      <div className="flex-grow">
        <h3 className="serif text-2xl mb-4 group-hover:text-black/60 transition-colors">{session.title}</h3>
        {snippet && (
          <p className="text-sm opacity-40 font-light italic leading-relaxed line-clamp-2 mb-6">
            "{snippet}"
          </p>
        )}
      </div>
      <div className="pt-6 border-t border-black/5 flex justify-between items-center mt-auto">
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">{t.open}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>
  );
};

const SessionView: React.FC<{
  session: VisionSession,
  userName: string,
  onBack: () => void,
  onStartGen: () => void,
  onError: (msg: string) => void,
  t: any,
  lang: Language
}> = ({ session, userName, onBack, onStartGen, onError, t, lang }) => {

  if (session.document && (session.is_paid || session.unlocked)) {
    const doc = session.document;

    const visionRef = React.useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
       await generateVisionPDF(session.document);
    };

    // Ikki formatni ham qo'llab-quvvatlash
// Vision statement
const visionStatement =
  typeof doc.vision_statement === 'object'
    ? doc.vision_statement?.summary || doc.vision_statement?.title || ''
    : doc.vision_statement || doc.visionStatement || '';

// Mission statement
const missionStatement =
  doc.objectives?.mandate ||
  doc.mission_statement ||
  doc.missionStatement || '';

// Core values
const coreValues =
  doc.core_tenets?.map((t: any) => ({ value: t.principle, description: t.description })) ||
  doc.core_values ||
  doc.coreValues?.map((v: any) => ({ value: v.value || v, description: v.description || '' })) ||
  [];

// Biblical foundation
const biblicalFoundation = (() => {
  if (doc.spiritual_foundation?.anchor_scriptures?.length > 0) {
    return doc.spiritual_foundation.anchor_scriptures.map((s: string) => {
      const parts = s.split(' - ');
      return { scripture: parts[0] || '', theme: parts.slice(1).join(' - ') || s };
    });
  }
  if (doc.biblical_foundation?.length > 0)
    return doc.biblical_foundation.map((b: any) => ({ theme: b.theme || b.reference || '', scripture: b.scripture || '' }));
  if (doc.biblicalFoundation?.length > 0)
    return doc.biblicalFoundation.map((b: any) => ({ theme: b.theme || b.reference || '', scripture: b.scripture || '' }));
  return [];
})();

// Strategic pillars
const strategicPillars =
  doc.strategic_pillars ||
  doc.strategicPillars?.map((p: any) => ({ pillar: p.pillar || p, description: p.description || '' })) ||
  [];

// Expected impact / next steps
const expectedImpact =
  doc.next_steps ||
  doc.execution_strategy?.short_term_steps ||
  doc.expected_impact ||
  doc.desiredOutcomes ||
  doc.walk_it_out?.next_steps ||
  [];
    // Extra normalized fields
    const title = doc.title || (typeof doc.vision_statement === 'object' ? doc.vision_statement?.title : '') || '';
    const subtitle = doc.vision_statement?.subtitle || '';
    const financialGoal = doc.objectives?.financial_goal || '';
    const biblicalModels: any[] = doc.spiritual_foundation?.biblical_models || [];
    const impactTargets = doc.impact_targets || null;
    const lifeContext = doc.life_context || null;
    const futurePicture: string[] = doc.visualize?.future_picture || doc.objectives?.kingdom_purpose || [];
    const longTerm: string[] = doc.execution_strategy?.long_term_stewardship || doc.walk_it_out?.weekly_practices || [];
    const resourceManagement: string = doc.execution_strategy?.resource_management || '';
    const risks: string[] = doc.risks_and_discernment || [];
    const rawDeclarations: string[] = doc.spiritual_tools?.declarations || [];
    const declarations = rawDeclarations.map((d: string) => {
      if (d.toLowerCase().startsWith('in the name of jesus') || d.toLowerCase().startsWith('in jesus')) return d;
      return `In the name of Jesus, I declare ${d.charAt(0).toLowerCase()}${d.slice(1)}`;
    });
    let prayer: string = doc.spiritual_tools?.prayer || '';
    if (prayer && !prayer.startsWith('Heavenly Father')) prayer = `Heavenly Father, ${prayer.charAt(0).toLowerCase()}${prayer.slice(1)}`;
    if (prayer && !prayer.toLowerCase().includes('in jesus name, amen') && !prayer.toLowerCase().includes("in jesus' name, amen")) {
      prayer = prayer.replace(/\.\s*$/, '') + '. In Jesus name, Amen.';
    }
    const reflectionPrompts: string[] = doc.spiritual_tools?.reflection_prompts || doc.reflect?.heart_check || [];

    const SectionHeader = ({ label }: { label: string }) => (
      <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 mb-4 pb-2 border-b border-black/10">{label}</h2>
    );

    return (
  <div className="max-w-3xl mx-auto px-6 md:px-12 animate-fade pt-10 pb-32">
    <div className="flex items-center justify-between mb-12">
      <button onClick={onBack} className="text-[10px] uppercase tracking-widest font-bold opacity-40">
        ← Library
      </button>
      <button onClick={handleDownloadPDF} className="text-[10px] uppercase tracking-widest font-bold bg-black text-white px-6 py-3 rounded-full hover:bg-black/80 transition-all">
        ↓ Save as PDF
      </button>
    </div>

    <div className="space-y-12">

      {/* TITLE */}
      <div>
        <h1 className="text-4xl md:text-5xl serif tracking-tight mb-2">{title}</h1>
        {subtitle && <p className="text-[10px] uppercase tracking-widest opacity-40">{subtitle}</p>}
        {visionStatement && <p className="text-lg serif leading-relaxed opacity-70 italic mt-4">{visionStatement}</p>}
        {financialGoal && (
          <div className="mt-4 pl-4 border-l-2 border-black/20 bg-black/5 p-3 rounded">
            <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Financial Goal</p>
            <p className="font-bold">{financialGoal}</p>
          </div>
        )}
      </div>

      {/* MANDATE */}
      {missionStatement && (
        <div>
          <SectionHeader label="Mandate" />
          <p className="text-base serif leading-relaxed opacity-80">{missionStatement}</p>
        </div>
      )}

      {/* BIBLE FOUNDATION */}
      {biblicalFoundation?.length > 0 && (
        <div>
          <SectionHeader label="Bible Foundation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {biblicalFoundation.map((b: any, i: number) => (
              <div key={i} className="pl-3 border-l-2 border-black/10">
                <p className="text-sm serif italic opacity-70">"{b.theme || b.reference || ''}"</p>
                {b.scripture && <p className="text-[10px] uppercase tracking-wider opacity-30 mt-1">— {b.scripture}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BIBLICAL MODELS */}
      {biblicalModels?.length > 0 && (
        <div>
          <SectionHeader label="Biblical Models" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {biblicalModels.map((m: any, i: number) => (
              <div key={i} className="bg-black/5 p-4 rounded">
                <p className="font-bold text-sm mb-1">{m.figure}</p>
                <p className="text-sm serif italic opacity-60">{m.attribute}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CORE VALUES */}
      {coreValues?.length > 0 && (
        <div>
          <SectionHeader label="Core Values" />
          <div className="space-y-3">
            {coreValues.map((v: any, i: number) => (
              <div key={i} className="bg-black/5 p-3 rounded">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1">{typeof v === 'string' ? v : v.value}</p>
                {typeof v !== 'string' && v.description && <p className="text-sm opacity-60">{v.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STRATEGIC PILLARS */}
      {strategicPillars?.length > 0 && (
        <div>
          <SectionHeader label="Strategic Pillars" />
          <div className="space-y-3">
            {strategicPillars.map((p: any, i: number) => (
              <div key={i} className="border-b border-black/5 pb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1">{typeof p === 'string' ? p : p.pillar}</p>
                {typeof p !== 'string' && p.description && <p className="text-sm opacity-60">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TARGET IMPACT */}
      {impactTargets && (
        <div>
          <SectionHeader label="Target Impact" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {impactTargets.individual && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Individual</p>
                <p className="text-sm opacity-70">{impactTargets.individual}</p>
              </div>
            )}
            {impactTargets.community && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Community</p>
                <p className="text-sm opacity-70">{impactTargets.community}</p>
              </div>
            )}
            {impactTargets.generational && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Generational</p>
                <p className="text-sm opacity-70">{impactTargets.generational}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KINGDOM PURPOSE */}
      {futurePicture?.length > 0 && (
        <div>
          <SectionHeader label="Kingdom Purpose" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {futurePicture.map((item: string, i: number) => (
              <p key={i} className="text-sm opacity-60">• {item}</p>
            ))}
          </div>
        </div>
      )}

      {/* LIFE CONTEXT */}
      {lifeContext && (
        <div>
          <SectionHeader label="Life Context" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifeContext.location && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Location</p>
                <p className="text-sm opacity-70">{lifeContext.location}</p>
              </div>
            )}
            {lifeContext.culture && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Culture</p>
                <p className="text-sm opacity-70">{lifeContext.culture}</p>
              </div>
            )}
            {lifeContext.timing && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Timing</p>
                <p className="text-sm opacity-70">{lifeContext.timing}</p>
              </div>
            )}
            {lifeContext.constraints && (
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-30 mb-1">Constraints</p>
                <p className="text-sm opacity-70">{lifeContext.constraints}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LONG TERM STEWARDSHIP */}
      {longTerm?.length > 0 && (
        <div>
          <SectionHeader label="Long-Term Stewardship" />
          <div className="space-y-2">
            {longTerm.map((item: string, i: number) => (
              <p key={i} className="text-sm opacity-60">• {item}</p>
            ))}
          </div>
        </div>
      )}

      {/* RESOURCE MANAGEMENT */}
      {resourceManagement && (
        <div>
          <SectionHeader label="Resource Management" />
          <p className="text-sm opacity-70 bg-black/5 p-3 rounded">{resourceManagement}</p>
        </div>
      )}

      {/* RISKS */}
      {risks?.length > 0 && (
        <div>
          <SectionHeader label="Risks & Discernment Notes" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {risks.map((item: string, i: number) => (
              <p key={i} className="text-sm opacity-60">• {item}</p>
            ))}
          </div>
        </div>
      )}

      {/* DECLARATIONS */}
      {declarations?.length > 0 && (
        <div className="bg-black text-white p-8 rounded-2xl">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 text-center mb-8">Declarations</p>
          <div className="space-y-6">
            {declarations.map((d: string, i: number) => (
              <p key={i} className="text-base serif italic text-center leading-relaxed">"{d}"</p>
            ))}
          </div>
        </div>
      )}

      {/* PRAYER */}
      {prayer && (
        <div>
          <SectionHeader label="Prayer of Surrender" />
          <p className="text-base serif italic leading-relaxed opacity-70">{prayer}</p>
        </div>
      )}

      {/* REFLECTION PROMPTS */}
      {reflectionPrompts?.length > 0 && (
        <div>
          <SectionHeader label="Reflection Prompts" />
          <div className="space-y-3">
            {reflectionPrompts.map((r: string, i: number) => (
              <p key={i} className="text-sm serif italic opacity-60 pl-3 border-l-2 border-black/10">{r}</p>
            ))}
          </div>
        </div>
      )}

      {/* NEXT STEPS — always last */}
      {expectedImpact?.length > 0 && (
        <div>
          <SectionHeader label="Next Steps" />
          <div className="space-y-4">
            {expectedImpact.map((item: string, i: number) => (
              <div key={i} className="flex gap-4">
                <span className="text-2xl font-bold opacity-20">{i + 1}</span>
                <p className="text-base opacity-70 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  </div>
);
}
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = session.language || lang;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleTranscription = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      handleInitialStep();
    }
  }, []);

  const handleInitialStep = async () => {
    setLoading(true);
    try {
      const firstMessage = await getNextDiscernmentStep([], DiscernmentState.VISION_SEED, session.language || lang);
      const newMessages: Message[] = [{ role: 'model', text: firstMessage }];
      setMessages(newMessages);
      await updateVisionChatSession(session.id, newMessages);
    } catch (err) {
      onError(t.errorFetch);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    
    try {
      await updateVisionChatSession(session.id, updatedMessages);
      const nextStep = await getNextDiscernmentStep(updatedMessages, session.state, session.language || lang);
      const modelMsg: Message = { role: 'model', text: nextStep };
      const finalMessages = [...updatedMessages, modelMsg];
      setMessages(finalMessages);
      await updateVisionChatSession(session.id, finalMessages);
    } catch (err) {
      onError(t.errorFetch);
    } finally {
      setLoading(false);
    }
  };

  const isReady = messages.some(m => m.text.toLowerCase().includes(t.readyForSynthesis.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 animate-fade h-[calc(100vh-8rem)] flex flex-col">
       <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-16 pr-4 no-scrollbar pb-10 pt-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
              <span className={`text-[9px] uppercase tracking-[0.4em] font-bold opacity-40 mb-3 px-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.role === 'model' ? 'Hazon' : userName}
              </span>
              <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] serif text-lg md:text-2xl text-[#111111] leading-relaxed font-normal ${m.role === 'user' ? 'opacity-60 text-right' : 'opacity-100 text-left'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start animate-pulse">
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40 mb-3 px-2">Hazon</span>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-20">{t.reflecting}</p>
            </div>
          )}
       </div>

       <div className="pb-4 pt-4 flex flex-col items-center gap-6 bg-[#F5F5F3] relative">
          {isReady ? (
            <div className="text-center space-y-6 w-full">
              <p className="serif italic opacity-60 text-lg">{t.finalizePrompt}</p>
              <button onClick={onStartGen} className="bg-black text-white px-12 py-5 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl shadow-black/20 hover:scale-105 transition-all">
                {t.generateVision}
              </button>
            </div>
          ) : (
            <div className="relative w-full flex items-center gap-2 md:gap-4">
              <button 
                onClick={toggleTranscription}
                className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black border border-black/5'}`}
              >
                {isListening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </button>
              <div className="flex-grow">
                <textarea 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={t.reflectHere}
                  className="w-full bg-white border border-black/5 rounded-[2.5rem] px-6 md:px-8 py-6 md:py-8 focus:outline-none focus:border-black/10 text-base md:text-lg resize-none shadow-sm min-h-[90px] md:min-h-[70px] no-scrollbar block"
                />
              </div>
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || loading} 
                className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-full text-white disabled:opacity-30 transition-all flex items-center justify-center shadow-lg active:scale-95 ${input.trim() ? 'bg-black' : 'bg-[#D1D1D1]'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}
          <div className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-20 select-none text-center">
            {t.truthTagline}
          </div>
       </div>
    </div>
  );
};

const ProfilePage: React.FC<{ user: any, profile: any, lang: Language, setLang: (l: Language) => void, onBack: () => void, onLogout: () => void, onPayments: () => void, t: any }> = ({ user, profile, lang, setLang, onBack, onLogout, onPayments, t }) => {
  const [showOffering, setShowOffering] = useState(false);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContribute = async () => {
    if (amount < 1) {
      setError(t.minContribution || "Please enter a contribution of $1 or more.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "verify-paystack-payment",
        {
          body: {
            action: "initialize",
            email: user.email,
            user_id: user.id,
            amount: Math.round(amount * 100), // Convert to cents
            vision_id: "offering", // Special ID for general offerings
          },
        }
      );

      if (invokeError) throw new Error("We couldn’t start the payment. Please try again.");
      if (!data?.data?.authorization_url) throw new Error("Payment gateway did not return a checkout link.");

      window.location.href = data.data.authorization_url;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "We couldn’t start the payment. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-12 animate-fade space-y-16">
      {showOffering && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade">
          <div className="bg-[#F5F5F3] w-full max-w-sm rounded-[3rem] p-10 md:p-14 border border-black/5 shadow-2xl relative">
            <button onClick={() => setShowOffering(false)} className="absolute top-4 right-4 p-4 opacity-30 hover:opacity-100 transition-opacity z-10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.5em] opacity-40 font-bold">{t.supportHazon}</p>
                  <h3 className="text-3xl serif">{t.supportHazon}</h3>
                </div>
                <p className="text-xs opacity-50 font-light leading-relaxed serif italic px-2">
                  {t.supportDesc || "Your support helps us keep Hazon running, allowing us to help seekers and believers worldwide. Every contribution is an investment in the mission of bringing God-centered clarity to those seeking direction."}
                </p>
              </div>

              <div className="py-8 border-y border-black/5 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold mb-3">{t.amount || "AMOUNT"}</span>
                <div className="flex items-center gap-1">
                  <span className="text-5xl font-bold tracking-tighter opacity-30">$</span>
                  <input 
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="text-5xl font-bold tracking-tighter bg-transparent border-none focus:ring-0 w-28 text-center"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button
                onClick={handleContribute}
                disabled={loading || amount < 1}
                className="w-full bg-black text-white py-5 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl shadow-black/10 hover:bg-black/80 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                {loading ? "..." : t.contribute}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl md:text-5xl serif tracking-tight font-normal">{t.profile}</h2>
        <button onClick={onBack} className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t.back}</button>
      </div>

      <div className="space-y-12">
        <div className="p-10 bg-white rounded-[2.5rem] border border-black/5 shadow-sm space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold">{t.accountInfo}</p>
            <h3 className="text-xl serif">{profile.full_name}</h3>
            <p className="opacity-40">{user.email}</p>
          </div>
          
          <div className="space-y-3 pt-6 border-t border-black/5">
             <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 block ml-1">{t.language}</label>
             <select 
               value={lang} 
               onChange={(e) => setLang(e.target.value as Language)}
               className="w-full bg-[#F5F5F3] rounded-full px-6 py-4 text-xs font-bold tracking-widest uppercase outline-none border border-transparent focus:border-black/5 transition-all"
             >
               <option value="en">English</option>
               <option value="es">Español</option>
               <option value="fr">Français</option>
               <option value="pt">Português</option>
               <option value="it">Italiano</option>
               <option value="de">Deutsch</option>
               <option value="nl">Nederlands</option>
               <option value="ar">العربية</option>
               <option value="ru">Русский</option>
               <option value="zh">中文</option>
               <option value="hi">हिन्दी</option>
               <option value="bn">বাংলা</option>
               <option value="ja">日本語</option>
               <option value="ko">한국어</option>
               <option value="sw">Kiswahili</option>
               <option value="tr">Türkçe</option>
               <option value="id">Bahasa Indonesia</option>
             </select>
          </div>

          <div className="pt-8 border-t border-black/5 flex flex-col gap-4">
             <button onClick={onPayments} className="text-left py-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex justify-between items-center">
                {t.paymentSettings}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
             </button>
             <button onClick={() => setShowOffering(true)} className="text-left py-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex justify-between items-center">
                {t.supportHazon}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
             </button>
             <a href="mailto:hazon223@gmail.com" className="text-left py-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex justify-between items-center">
                {t.improvementSuggestions}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
             </a>
          </div>
        </div>

        <button onClick={onLogout} className="w-full py-5 rounded-full border border-red-500/10 text-red-500/60 text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-red-50 transition-all">
          {t.logout}
        </button>
      </div>
    </div>
  );
};

const PaymentsSettings: React.FC<{ cards: CreditCard[], onAddCard: (c: CreditCard) => void, onRemoveCard: (id: string) => void, onBack: () => void, t: any }> = ({ cards, onAddCard, onRemoveCard, onBack, t }) => {
  const [showAdd, setShowAdd] = useState(false);
  
  return (
    <div className="max-w-xl mx-auto p-6 md:p-12 animate-fade space-y-16">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl md:text-5xl serif tracking-tight font-normal">{t.paymentSettings}</h2>
        <button onClick={onBack} className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t.back}</button>
      </div>

      <div className="space-y-10">
        <div className="grid gap-6">
          {cards.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-[2rem]">
              <p className="text-[11px] uppercase tracking-[0.4em] opacity-30 font-bold">{t.noCards}</p>
            </div>
          ) : (
            cards.map(card => (
              <div key={card.id} className="bg-white p-8 rounded-[2rem] border border-black/5 flex justify-between items-center shadow-sm">
                <div className="space-y-1">
                  <p className="font-bold tracking-widest text-[10px] uppercase opacity-40">{card.brand}</p>
                  <p className="text-lg tracking-wider">•••• •••• •••• {card.last4}</p>
                  <p className="text-xs opacity-30 uppercase tracking-widest">{card.name} — {card.expiry}</p>
                </div>
                <button onClick={() => onRemoveCard(card.id)} className="text-red-500/40 hover:text-red-500 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} className="w-full bg-black text-white py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold shadow-lg shadow-black/10">
            {t.addCard}
          </button>
        ) : (
          <AddCardForm onAdd={(c) => { onAddCard(c); setShowAdd(false); }} onCancel={() => setShowAdd(false)} t={t} />
        )}
      </div>
    </div>
  );
};

const AddCardForm: React.FC<{ onAdd: (c: CreditCard) => void, onCancel: () => void, t: any }> = ({ onAdd, onCancel, t }) => {
  const [formData, setFormData] = useState({ name: '', number: '', expiry: '', cvv: '' });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Math.random().toString(),
      last4: formData.number.replace(/\s/g, '').slice(-4),
      brand: 'CARD',
      expiry: formData.expiry,
      name: formData.name
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-black/10 shadow-xl space-y-6 animate-fade">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 ml-4">{t.cardName}</label>
          <input 
            placeholder="John Doe" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full bg-[#F9F9F8] rounded-full px-7 py-4 focus:outline-none border border-black/5" 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 ml-4">{t.cardNumber}</label>
          <input 
            placeholder="0000 0000 0000 0000" 
            value={formData.number} 
            onChange={e => setFormData({...formData, number: formatCardNumber(e.target.value)})} 
            className="w-full bg-[#F9F9F8] rounded-full px-7 py-4 focus:outline-none border border-black/5 tracking-widest" 
            required 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 ml-4">{t.expiryDate}</label>
            <input 
              placeholder="00/00" 
              maxLength={5}
              value={formData.expiry} 
              onChange={e => setFormData({...formData, expiry: formatExpiry(e.target.value)})} 
              className="w-full bg-[#F9F9F8] rounded-full px-7 py-4 focus:outline-none border border-black/5" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 ml-4">{t.cvv}</label>
            <input 
              placeholder="000" 
              type="password" 
              maxLength={3} 
              value={formData.cvv} 
              onChange={e => setFormData({...formData, cvv: e.target.value.replace(/[^0-9]/gi, '')})} 
              className="w-full bg-[#F9F9F8] rounded-full px-7 py-4 focus:outline-none border border-black/5" 
              required 
            />
          </div>
        </div>
      </div>
      <div className="flex gap-4 pt-6">
        <button type="submit" className="flex-grow bg-black text-white py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg shadow-black/20">{t.save}</button>
        <button type="button" onClick={onCancel} className="flex-grow py-5 rounded-full border border-black/5 text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 hover:opacity-100">{t.back}</button>
      </div>
    </form>
  );
};

const AuthScreen: React.FC<{ onAuth: (u: any) => void, onConfirm: (t: string, d: string) => void, onError: (msg: string) => void, t: any }> = ({ onAuth, onConfirm, onError, t }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else if (authMode === 'signup') {
        await signUpWithProfile(email, password, name);
        onConfirm(t.confSignupTitle, t.confSignupDesc);
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        onConfirm(t.confForgotTitle, t.confForgotDesc);
      }
    } catch (err: any) {
      onError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithGoogle(); } catch (err: any) { onError(t.errorGeneric); }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F3] p-6 animate-fade">
      <div className="mb-10 md:mb-16 text-center">
        <h1 className="text-5xl md:text-8xl serif tracking-tighter leading-none mb-1 font-normal">Hazon</h1>
        <p className="text-[10px] md:text-[12px] uppercase tracking-[0.5em] opacity-40 font-bold">{translations.en.clearVision}</p>
      </div>
      <div className="w-full max-w-[340px] space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fix: Wrap setName in an arrow function that extracts e.target.value to resolve type incompatibility with onChange */}
          {authMode === 'signup' && <input placeholder={t.nameLabel} value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white border border-black/5 rounded-full px-7 py-4 focus:outline-none focus:border-black/20 text-base shadow-sm" />}
          <input type="email" placeholder={t.emailLabel} value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white border border-black/5 rounded-full px-7 py-4 focus:outline-none focus:border-black/20 text-base shadow-sm" />
          {authMode !== 'forgot' && <input type="password" placeholder={t.passwordLabel} value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white border border-black/5 rounded-full px-7 py-4 focus:outline-none focus:border-black/20 text-base shadow-sm" />}
          <button type="submit" disabled={loading} className="w-full bg-black text-white rounded-full py-4 md:py-5 mt-2 text-[10px] md:text-[12px] uppercase tracking-[0.4em] font-bold hover:bg-black/90 transition-all shadow-md shadow-black/5 disabled:opacity-50">
            {loading ? "..." : (authMode === 'login' ? t.enter : (authMode === 'signup' ? t.createAccount : t.sendResetLink))}
          </button>
        </form>
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-black/5"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest opacity-20 font-bold">OR</span>
          <div className="flex-grow border-t border-black/5"></div>
        </div>
        <button onClick={handleGoogleLogin} className="w-full bg-white text-black border border-black/5 rounded-full py-4 md:py-5 flex items-center justify-center gap-3 text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-black/[0.02] transition-all shadow-md shadow-black/5 active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.551 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.059.957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {t.continueGoogle}
        </button>
        <div className="flex justify-between items-center px-1">
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] md:text-[11px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">{authMode === 'login' ? t.signup : t.login}</button>
          <button onClick={() => setAuthMode(authMode === 'forgot' ? 'login' : 'forgot')} className="text-[10px] md:text-[11px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">{authMode === 'forgot' ? t.backToLogin : t.forgotPassword}</button>
        </div>
      </div>
    </div>
  );
};

const NotFoundView: React.FC<{ onBack: () => void, t: any }> = ({ onBack, t }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center text-center px-6">
    <div className="animate-fade space-y-6 max-w-md">
      <h2 className="text-3xl serif">{t.notFoundTitle}</h2>
      <p className="text-sm opacity-50 leading-relaxed">{t.notFoundDesc}</p>
      <button onClick={onBack} className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest">{t.returnLibrary}</button>
    </div>
  </div>
);

const GeneratingView: React.FC<{ session: VisionSession, onComplete: (doc: VisionDocument) => void, onBack: () => void, onError: (msg: string) => void, t: any, lang: Language }> = ({ session, onComplete, onBack, onError, t, lang }) => {
  const [failed, setFailed] = useState(false);

  const runGeneration = async () => {
    setFailed(false);
    try {
      const doc = await generateSynthesis(session.messages, session.language || lang);
      const { error } = await supabase.from('visions').update({ 
        generated_vision: doc, 
        status: DiscernmentState.COMPLETE,
        title: doc.title 
      }).eq('id', session.id);
      
      if (error) throw error;
      
      onComplete(doc);
    } catch (err: any) {
      setFailed(true);
      onError(err.message || t.errorFetch);
    }
  };

  useEffect(() => {
    runGeneration();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center px-6">
      <div className="animate-fade space-y-6">
        {!failed ? (
          <>
            <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-3xl md:text-5xl serif font-normal tracking-tight">{t.generatingTitle}</h2>
            <p className="max-w-md mx-auto text-sm md:text-base opacity-40 font-light">{t.generatingDesc}</p>
          </>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl serif text-red-800/80">Generation Failed</h2>
            <div className="flex flex-col gap-3">
              <button onClick={runGeneration} className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest">{t.retry}</button>
              <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.back}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConfirmationView: React.FC<{ title: string, desc: string, onBack: () => void, t: any }> = ({ title, desc, onBack, t }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center text-center px-6">
    <div className="animate-fade space-y-6 max-w-md">
      <h2 className="text-3xl serif">{title}</h2>
      <p className="text-sm opacity-50 leading-relaxed">{desc}</p>
      <button onClick={onBack} className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest">{t.backToLogin}</button>
    </div>
  </div>
);

export default App;