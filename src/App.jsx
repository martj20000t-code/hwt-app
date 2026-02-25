import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, CheckCircle, User, LogOut, Plus, Trash2, List, 
  ArrowRight, Download, UserPlus, ArrowLeft, Edit, 
  RefreshCw, RefreshCcw, Smartphone, Building, Search, Grid 
} from 'lucide-react';

// --- 파이어베이스 설정 ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

let firebaseConfig;
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config
    ? JSON.parse(__firebase_config) 
    : {
        apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
        authDomain: "hwt-app-fcd56.firebaseapp.com",
        projectId: "hwt-app-fcd56",
        storageBucket: "hwt-app-fcd56.firebasestorage.app",
        messagingSenderId: "697712630635",
        appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
      };
} catch (e) {
  firebaseConfig = {
    apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
    authDomain: "hwt-app-fcd56.firebaseapp.com",
    projectId: "hwt-app-fcd56",
    storageBucket: "hwt-app-fcd56.firebasestorage.app",
    messagingSenderId: "697712630635",
    appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hwt-app-fcd56';

// --- 전역 유틸 함수 ---
const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

const formatPhoneStr = (value) => {
  if (!value) return '';
  const str = value.replace(/[^0-9]/g, '');
  if (str.startsWith('02')) {
    if (str.length < 3) return str;
    if (str.length < 6) return `${str.slice(0, 2)}-${str.slice(2)}`;
    if (str.length < 10) return `${str.slice(0, 2)}-${str.slice(2, 5)}-${str.slice(5)}`;
    return `${str.slice(0, 2)}-${str.slice(2, 6)}-${str.slice(6, 10)}`;
  } else {
    if (str.length < 4) return str;
    if (str.length < 7) return `${str.slice(0, 3)}-${str.slice(3)}`;
    if (str.length < 11) return `${str.slice(0, 3)}-${str.slice(3, 6)}-${str.slice(6)}`;
    return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7, 11)}`;
  }
};

const generateOrderId = (existingOrders, formattedLoadingDate, currentIterationIndex) => {
  const datePrefix = formattedLoadingDate.replace(/-/g, ''); 
  const sameDayOrders = existingOrders.filter(o => String(o.id).startsWith(datePrefix));
  let maxSeq = 0;
  sameDayOrders.forEach(o => {
    const seqStr = String(o.id).slice(-3);
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });
  const nextSeq = maxSeq + 1 + currentIterationIndex;
  return Number(`${datePrefix}${String(nextSeq).padStart(3, '0')}`);
};

const getDispatchText = (order) => {
  let name = '관리자';
  if (order.isReassigned && order.reassignedBy) name = order.reassignedBy;
  else if (order.isEdited && order.editedBy) name = order.editedBy;
  else if (order.dispatchedBy) name = order.dispatchedBy;
  else if (order.assignedBy) name = order.assignedBy;
  
  let suffix = '';
  if (order.isReassigned) suffix = ' (이관)';
  else if (order.isEdited) suffix = ' (수정)';

  return `배차: ${name}${suffix}`;
};

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// --- 기본 데이터 설정 ---
const defaultDrivers = [
  { id: 1, vehicleNumber: '82가1234', name: '홍길동', phone: '010-1234-5678', password: '1', chassisType: '가변형 평판' },
  { id: 2, vehicleNumber: '울산99바2928', name: '이국호', phone: '010-7100-0393', password: '1234', chassisType: '' }
];

const defaultClients = [
  { 
    id: 1, name: '테스트 고객사(주)', type: '화주', address: '울산광역시 남구', bizNo: '123-45-67890', 
    manager1: '김담당', manager2: '', phone1: '010-1111-2222', phone2: '', 
    notes: '항상 빠른 배차 부탁드립니다.', loginId: 'test', password: '1234' 
  },
  { 
    id: 2, name: 'CM 물류', type: '운수사', address: '', bizNo: '', 
    manager1: '', manager2: '', phone1: '', phone2: '', 
    notes: 'CM 물류 운수사 계정', loginId: 'cmlogis', password: '1234' 
  }
];

const adminsList = [
  { id: 'admin1', name: '이상현 부장' },
  { id: 'admin2', name: '이국희 과장' }
];

const LogoSVG = ({ className = "h-10 w-auto shrink-0" }) => (
  <svg className={className} viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-3, 0)">
      <polygon points="54,21 98,65 98,95 54,51" fill="#1b3687" />
      <rect x="54" y="102" width="6" height="25" fill="#d19f1f" />
    </g>
    <g transform="translate(3, 0)">
      <polygon points="102,65 114,53 114,83 102,95" fill="#606265" />
      <polygon points="118,49 130,37 130,67 118,79" fill="#606265" />
      <polygon points="134,33 146,21 146,51 134,63" fill="#606265" />
      <rect x="140" y="102" width="6" height="25" fill="#d19f1f" />
    </g>
    <text x="98" y="126" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="30" fill="#8e9094" letterSpacing="-0.5" textAnchor="middle">HWT</text>
    <text x="100" y="146" fontFamily="Arial, sans-serif" fontWeight="bold" fontStyle="italic" fontSize="11" fill="#4a4a4a" textAnchor="middle">Hyun woo Transport</text>
  </svg>
);

const RankThreeStars = () => (
  <div className="flex items-center gap-[2px] mr-1.5 bg-[#1e293b] border border-[#0f172a] px-1.5 py-1 rounded-md shadow-md relative overflow-hidden shrink-0" title="3스타 (중장)">
    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
    {[1,2,3].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] relative z-10 md:w-3.5 md:h-3.5">
        <defs><linearGradient id={`gold-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FEF08A" /><stop offset="40%" stopColor="#EAB308" /><stop offset="100%" stopColor="#854D0E" /></linearGradient></defs>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={`url(#gold-grad-${i})`} stroke="#422006" strokeWidth="0.5"/>
      </svg>
    ))}
  </div>
);

const RankCaptain = () => (
  <div className="flex items-center gap-[2px] mr-1.5 bg-[#1e293b] border border-[#0f172a] px-1.5 py-1 rounded-md shadow-md relative overflow-hidden shrink-0" title="대위">
    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
    {[1,2,3].map(i => (
      <svg key={i} width="10" height="12" viewBox="0 0 24 24" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] relative z-10 md:w-3 md:h-3.5">
        <defs><linearGradient id={`silver-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F8FAFC" /><stop offset="40%" stopColor="#94A3B8" /><stop offset="100%" stopColor="#334155" /></linearGradient></defs>
        <polygon points="12 2 20 12 12 22 4 12" fill={`url(#silver-grad-${i})`} stroke="#0F172A" strokeWidth="0.5"/>
      </svg>
    ))}
  </div>
);

// ==================== 1. 로그인 스크린 ====================
const LoginScreen = ({ clients, drivers, pendingDrivers, setCurrentUser, setUserType, setActiveTab, showAlert, addPendingDriver }) => {
  const [tab, setTab] = useState('client'); 

  const [clientId, setClientId] = useState('');
  const [clientPw, setClientPw] = useState('');
  const [rememberClient, setRememberClient] = useState(false);

  const [driverVehicle, setDriverVehicle] = useState('');
  const [driverPw, setDriverPw] = useState('');
  const [rememberDriver, setRememberDriver] = useState(false);

  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [regVehicle, setRegVehicle] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  useEffect(() => {
    const savedVehicle = localStorage.getItem('savedDriverVehicle');
    const savedPw = localStorage.getItem('savedDriverPw');
    if (savedVehicle && savedPw) {
      setDriverVehicle(savedVehicle); setDriverPw(savedPw); setRememberDriver(true);
    }

    const savedClientId = localStorage.getItem('savedClientId');
    const savedClientPw = localStorage.getItem('savedClientPw');
    if (savedClientId && savedClientPw) {
      setClientId(savedClientId); setClientPw(savedClientPw); setRememberClient(true);
    }
  }, []);

  const handleClientLogin = () => {
    if (!clientId || !clientPw) return showAlert('아이디와 비밀번호를 모두 입력해주세요.');
    const approvedClient = clients.find(c => c.loginId === clientId);
    if (approvedClient) {
      if (approvedClient.password === clientPw) {
        if (rememberClient) {
          localStorage.setItem('savedClientId', clientId);
          localStorage.setItem('savedClientPw', clientPw);
        } else {
          localStorage.removeItem('savedClientId');
          localStorage.removeItem('savedClientPw');
        }
        setCurrentUser(approvedClient);
        setUserType('client');
        return;
      } else {
        return showAlert('비밀번호가 일치하지 않습니다.');
      }
    }
    showAlert('등록되지 않은 고객사 아이디입니다.\n아이디가 없다면 현우종합운수에 문의해주세요.');
  };

  const handleDriverLogin = () => {
    if (!driverVehicle || !driverPw) return showAlert('차량번호와 비밀번호를 모두 입력해주세요.');
    const approvedDriver = drivers.find(d => d.vehicleNumber === driverVehicle);
    if (approvedDriver) {
      if (approvedDriver.password === driverPw) {
        if (rememberDriver) {
          localStorage.setItem('savedDriverVehicle', driverVehicle);
          localStorage.setItem('savedDriverPw', driverPw);
        } else {
          localStorage.removeItem('savedDriverVehicle');
          localStorage.removeItem('savedDriverPw');
        }
        setCurrentUser(approvedDriver);
        setUserType('driver');
        return;
      } else {
        return showAlert('비밀번호가 일치하지 않습니다.');
      }
    }
    const isPending = pendingDrivers.some(d => d.vehicleNumber === driverVehicle);
    if (isPending) return showAlert('아직 승인 대기 중입니다.\n관리자의 가입 승인 후 접속이 가능합니다.');
    showAlert('등록되지 않은 차량번호입니다.\n신규 기사인 경우 가입 신청을 먼저 해주세요.');
  };

  const handleRegisterSubmit = () => {
    if (!regVehicle || !regPw || !regName || !regPhone) {
      showAlert('모든 정보를 정확히 입력해주세요.');
      return;
    }
    if (drivers.some(d => d.vehicleNumber === regVehicle) || pendingDrivers.some(d => d.vehicleNumber === regVehicle)) {
      showAlert('이미 등록되었거나 승인 대기 중인 차량번호입니다.');
      return;
    }
    const newId = Date.now();
    const newDriver = { id: newId, vehicleNumber: regVehicle, password: regPw, name: regName, phone: regPhone, chassisType: '' };
    
    addPendingDriver(newDriver);
    showAlert(`[가입 신청 완료]\n관리자 승인 후 접속 가능합니다.`);
    setRegVehicle(''); setRegPw(''); setRegName(''); setRegPhone('');
    setIsRegistering(false);
  };

  const handleAdminLogin = () => {
    if (adminId === '1' && adminPw === '1') {
      setUserType('admin'); setCurrentUser({ role: 'admin', id: 'admin1', name: '이상현 부장' }); setActiveTab('realtime'); 
    } else if (adminId === '2' && adminPw === '2') {
      setUserType('admin'); setCurrentUser({ role: 'admin', id: 'admin2', name: '이국희 과장' }); setActiveTab('realtime'); 
    } else {
      showAlert('관리자 아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="p-6 md:p-10 flex flex-col items-center border-b border-gray-100">
          <LogoSVG className="h-20 w-auto md:h-24 shrink-0 mb-3" />
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-2 text-center">현우종합운수</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium text-center">통합 배차 관리 시스템</p>
        </div>
        
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button className={`flex-1 py-3.5 md:py-4 font-bold text-[13px] md:text-sm transition-all active:bg-gray-100 ${tab === 'client' && !isRegistering ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => {setTab('client'); setIsRegistering(false);}}>고객사 접속</button>
          <button className={`flex-1 py-3.5 md:py-4 font-bold text-[13px] md:text-sm transition-all active:bg-gray-100 ${tab === 'driver' && !isRegistering ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => {setTab('driver'); setIsRegistering(false);}}>기사님 접속</button>
          <button className={`flex-1 py-3.5 md:py-4 font-bold text-[13px] md:text-sm transition-all active:bg-gray-100 ${tab === 'admin' && !isRegistering ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => {setTab('admin'); setIsRegistering(false);}}>관리자 접속</button>
        </div>

        <div className="p-5 md:p-8 space-y-4 md:space-y-5">
          {isRegistering ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">차량번호</label>
                <input type="text" placeholder="예: 82가1234" value={regVehicle} onChange={(e) => setRegVehicle(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">비밀번호 설정</label>
                <input type="password" placeholder="비밀번호 입력" value={regPw} onChange={(e) => setRegPw(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">기사님 성함</label>
                <input type="text" placeholder="예: 홍길동" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">연락처</label>
                <input type="text" placeholder="예: 010-1234-5678" value={regPhone} onChange={(e) => setRegPhone(formatPhoneStr(e.target.value))} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" />
              </div>
              <button onClick={handleRegisterSubmit} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-95 transition-all mt-4 select-none">가입 신청하기</button>
              <div className="text-center mt-2">
                <button onClick={() => setIsRegistering(false)} className="text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 underline p-2">로그인 화면으로 돌아가기</button>
              </div>
            </>
          ) : tab === 'client' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">고객사 아이디</label>
                <input type="text" placeholder="아이디 입력" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" value={clientId} onChange={(e) => setClientId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">비밀번호</label>
                <input type="password" placeholder="비밀번호 입력" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" value={clientPw} onChange={(e) => setClientPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()} />
              </div>
              <div className="flex items-center gap-2 mt-2 mb-4 pl-1">
                <input type="checkbox" id="rememberClient" checked={rememberClient} onChange={(e) => setRememberClient(e.target.checked)} className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 cursor-pointer" />
                <label htmlFor="rememberClient" className="text-sm font-bold text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors">아이디/비밀번호 저장</label>
              </div>
              <button onClick={handleClientLogin} className="w-full bg-blue-600 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-blue-700 active:scale-[0.98] transition-all select-none">고객사 로그인</button>
            </>
          ) : tab === 'driver' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">차량번호 입력</label>
                <input type="text" placeholder="예: 82가1234" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" value={driverVehicle} onChange={(e) => setDriverVehicle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDriverLogin()} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">비밀번호</label>
                <input type="password" placeholder="비밀번호 입력" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" value={driverPw} onChange={(e) => setDriverPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDriverLogin()} />
              </div>
              <div className="flex items-center gap-2 mt-2 mb-4 pl-1">
                <input type="checkbox" id="rememberDriver" checked={rememberDriver} onChange={(e) => setRememberDriver(e.target.checked)} className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 cursor-pointer" />
                <label htmlFor="rememberDriver" className="text-sm font-bold text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors">아이디/비밀번호 저장</label>
              </div>
              <button onClick={handleDriverLogin} className="w-full bg-gray-900 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-[0.98] transition-all select-none">기사님 로그인</button>
              <div className="text-center mt-4">
                <button onClick={() => setIsRegistering(true)} className="text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 underline p-2">신규 기사 가입신청</button>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
                <button onClick={() => showAlert("📱 [앱 설치 방법]\n\n1. 스마트폰 인터넷(크롬/사파리) 설정 메뉴 열기\n2. '홈 화면에 추가' 또는 '앱 설치' 버튼 누르기\n3. 바탕화면에 현우종합운수 아이콘 생성 완료!")} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 active:scale-95 transition-all">
                  <Smartphone size={16} /> 바탕화면에 앱 설치하기
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">관리자 아이디</label>
                <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 text-[16px] transition-colors" />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">비밀번호</label>
                <input type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 text-[16px] transition-colors" />
              </div>
              <button onClick={handleAdminLogin} className="w-full bg-gray-900 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-[0.98] transition-all mt-4 select-none">관리자 로그인</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 2. 기사 앱 컴포넌트 ====================
const DriverApp = ({ orders, drivers, currentUser, setCurrentUser, setUserType, setActiveTab, showAlert, showConfirm, handleRefresh, isRefreshing, updateOrder, updateDriver }) => {
  const [driverActiveTab, setDriverActiveTab] = useState('transit');

  useEffect(() => {
    window.history.pushState({ loggedIn: true }, '', '');
    const onPopState = () => {
      window.history.pushState({ loggedIn: true }, '', '');
      setDriverActiveTab('transit'); 
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [driverHistoryStart, setDriverHistoryStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [driverHistoryEnd, setDriverHistoryEnd] = useState(() => getLocalDateString(lastDayOfMonth));

  const handleDriverDateChange = (type, value) => {
    const newStart = type === 'start' ? value : driverHistoryStart;
    const newEnd = type === 'end' ? value : driverHistoryEnd;
    const sDate = new Date(newStart);
    const eDate = new Date(newEnd);
    if ((eDate - sDate) / (1000 * 60 * 60 * 24) > 31) {
      showAlert('운송 완료 내역 조회는 최대 1달(31일)까지만 가능합니다.');
      if (type === 'start') {
        const maxEnd = new Date(sDate); maxEnd.setDate(maxEnd.getDate() + 31);
        setDriverHistoryStart(value); setDriverHistoryEnd(getLocalDateString(maxEnd));
      } else {
        const minStart = new Date(eDate); minStart.setDate(minStart.getDate() - 31);
        setDriverHistoryEnd(value); setDriverHistoryStart(getLocalDateString(minStart));
      }
      return;
    }
    if (type === 'start') setDriverHistoryStart(value);
    else setDriverHistoryEnd(value);
  };

  const transitOrders = orders.filter(o => o.driverId === currentUser.id && o.status !== 'completed').sort((a,b) => b.id - a.id);
  const completedOrders = orders.filter(o => {
    if (o.driverId !== currentUser.id || o.status !== 'completed') return false;
    const orderDate = o.loadingTime ? o.loadingTime.split(' ')[0] : '';
    if (driverHistoryStart && orderDate < driverHistoryStart) return false;
    if (driverHistoryEnd && orderDate > driverHistoryEnd) return false;
    return true;
  }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

  const displayOrders = driverActiveTab === 'transit' ? transitOrders : completedOrders;

  const handleNextStatus = (orderId, currentStatus) => {
    if (currentStatus === 'assigned') {
      showConfirm('상차완료 하시겠습니까?', () => {
        updateOrder(orderId, { status: 'loaded', loadedAt: new Date().toISOString() });
      });
    } else if (currentStatus === 'loaded') {
      showConfirm('하차완료 하시겠습니까?', () => {
        updateOrder(orderId, { status: 'completed', completedAt: new Date().toISOString() });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 p-3 md:p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm w-full shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { handleRefresh(); setDriverActiveTab('transit'); }}>
            <LogoSVG className="h-6 md:h-8 w-auto shrink-0" />
            <span className="hidden sm:inline font-black text-gray-900 text-sm md:text-lg tracking-tight mr-1 shrink-0">현우종합운수</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto">
          <div className="flex flex-col items-end mr-1 md:mr-3 justify-center pt-0.5">
            <span className="text-[13px] md:text-[14px] font-black text-gray-800 leading-none mb-1.5">{currentUser.vehicleNumber}</span>
            <span className="text-[11px] md:text-[12px] font-bold text-blue-600 leading-none">{currentUser.name} 기사님</span>
          </div>
          <button onClick={handleRefresh} className="p-1.5 md:px-2 md:py-1.5 text-gray-500 hover:text-blue-600 active:text-blue-800 transition-colors rounded-lg active:bg-blue-50 shrink-0 flex items-center gap-1 border border-transparent hover:border-gray-200">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">새로고침</span>
          </button>
          <button onClick={() => { setUserType(null); setCurrentUser(null); setActiveTab('realtime'); }} className="p-1.5 md:px-2 md:py-1.5 text-gray-500 hover:text-gray-800 active:bg-gray-100 transition-colors rounded-lg shrink-0 flex items-center gap-1 border border-transparent hover:border-gray-200">
            <LogOut size={14}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">로그아웃</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-4 space-y-4 overflow-y-auto pb-28 md:pb-32 scroll-smooth w-full">
        {driverActiveTab === 'transit' || driverActiveTab === 'completed' ? (
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <h2 className="text-base md:text-lg font-bold text-gray-900 px-1">
              {driverActiveTab === 'transit' ? `배차 내역 (${transitOrders.length})` : `완료된 내역 (${completedOrders.length})`}
            </h2>

            {driverActiveTab === 'completed' && (
              <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm mb-2 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input type="date" value={driverHistoryStart} onChange={(e) => handleDriverDateChange('start', e.target.value)} className="w-full sm:flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none" />
                  <span className="hidden sm:inline text-gray-400 font-bold">~</span>
                  <input type="date" value={driverHistoryEnd} onChange={(e) => handleDriverDateChange('end', e.target.value)} className="w-full sm:flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none" />
                </div>
              </div>
            )}

            {displayOrders.length === 0 ? (
              <div className="text-center py-16 md:py-20 text-gray-400 font-medium bg-white rounded-2xl border shadow-sm border-gray-200 text-sm mx-1">
                {driverActiveTab === 'transit' ? '현재 대기 중이거나 진행 중인 배차가 없습니다.' : '해당 기간 내 운송 완료된 내역이 없습니다.'}
              </div>
            ) : (
              displayOrders.map(order => (
                <div key={order.id} className={`bg-white rounded-2xl shadow-sm border transition-all w-full overflow-hidden ${order.status === 'completed' ? 'border-gray-200 opacity-80 bg-gray-50' : 'border-gray-300'}`}>
                  <div className="p-3 md:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'assigned' && <span className="px-2.5 md:px-3 py-1 bg-white border border-gray-300 text-gray-800 rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">{getDispatchText(order)}</span>}
                      {order.status === 'loaded' && <span className="px-2.5 md:px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">상차완료</span>}
                      {order.status === 'completed' && <span className="px-2.5 md:px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap">운송완료</span>}
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-gray-500 tracking-wider shrink-0 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">ORDER #{order.id}</span>
                  </div>

                  <div className="p-3.5 md:p-5 space-y-4 md:space-y-5">
                    <div className="relative pl-5 md:pl-6 border-l-2 border-gray-200 space-y-5 md:space-y-6 ml-1 md:ml-2">
                      <div className="relative">
                        <div className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full -left-[27px] md:-left-[31px] top-1"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0 pr-2">
                            <p className="text-[12px] md:text-[13px] font-bold text-gray-500 mb-1.5 flex flex-wrap items-center gap-1.5">상차예정 <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[13px] md:text-[14px] shadow-sm border border-blue-100 shrink-0">{formatDate(order.loadingTime)}</span></p>
                            <p className="text-base md:text-lg font-bold text-gray-900 leading-tight break-keep">{order.loadingLoc}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute w-3 h-3 bg-gray-800 rounded-full -left-[27px] md:-left-[31px] top-1"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0 pr-2">
                            <p className="text-[12px] md:text-[13px] font-bold text-gray-500 mb-1.5 flex flex-wrap items-center gap-1.5">하차예정 <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-[13px] md:text-[14px] shadow-sm border border-orange-100 shrink-0">{formatDate(order.unloadingTime)}</span></p>
                            <p className="text-base md:text-lg font-bold text-gray-900 leading-tight break-keep">{order.unloadingLoc}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 md:p-4 rounded-xl space-y-2.5 border border-gray-100 shadow-sm w-full">
                       {order.equipment && <div className="flex justify-between items-center gap-2"><span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">장비</span> <span className="text-xs md:text-sm font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded border border-blue-100 truncate text-right">{order.equipment}</span></div>}
                       <div className="flex justify-between items-center gap-2"><span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">제품명(호선)</span> <span className="text-xs md:text-sm font-bold text-gray-800 truncate text-right">{order.productName}</span></div>
                       {order.notes && <div className="flex justify-between items-start pt-2.5 mt-1 border-t border-gray-200/80 gap-2"><span className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5 shrink-0">주의사항</span> <span className="text-xs md:text-sm font-bold text-red-500 text-right break-keep">{order.notes}</span></div>}
                    </div>

                    {order.status === 'assigned' && <button onClick={() => handleNextStatus(order.id, order.status)} className="w-full py-3.5 md:py-4 bg-gray-900 text-white rounded-xl font-bold text-base md:text-lg shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all select-none">상차완료 보고하기</button>}
                    {order.status === 'loaded' && <button onClick={() => handleNextStatus(order.id, order.status)} className="w-full py-3.5 md:py-4 bg-blue-600 text-white rounded-xl font-bold text-base md:text-lg shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all select-none">하차완료 보고하기</button>}
                  </div>
                </div>
              ))
            )}
            <div className="h-10 w-full opacity-0 pointer-events-none"></div>
          </div>
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex p-2 md:p-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe h-16 md:h-[72px]">
        <button onClick={() => setDriverActiveTab('transit')} className={`flex flex-col items-center justify-center gap-1 transition-colors w-1/2 h-full ${driverActiveTab === 'transit' ? 'text-gray-900' : 'text-gray-400'}`}>
          <Truck size={22} className="shrink-0" /><span className="text-[10px] md:text-[11px] font-bold">운송중</span>
        </button>
        <div className="w-px bg-gray-100 my-2"></div>
        <button onClick={() => setDriverActiveTab('completed')} className={`flex flex-col items-center justify-center gap-1 transition-colors w-1/2 h-full ${driverActiveTab === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
          <CheckCircle size={22} className="shrink-0" /><span className="text-[10px] md:text-[11px] font-bold">운송완료</span>
        </button>
      </nav>
    </div>
  );
};

// ==================== 3. 고객사 앱 컴포넌트 ====================
const ClientApp = ({ orders, currentUser, setCurrentUser, setUserType, showAlert, showConfirm, handleRefresh, isRefreshing, addOrders, adminsList }) => {
  const [clientActiveTab, setClientActiveTab] = useState('request');

  useEffect(() => {
    window.history.pushState({ loggedIn: true }, '', '');
    const onPopState = () => {
      window.history.pushState({ loggedIn: true }, '', '');
      setClientActiveTab('request'); 
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');

  const [newOrder, setNewOrder] = useState({
    loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
    unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
    equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
    loadingManager: '', unloadingManager: '', notes: '', managerId: '', orderCount: 1
  });

  const [clientHistoryStart, setClientHistoryStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [clientHistoryEnd, setClientHistoryEnd] = useState(() => getLocalDateString(lastDayOfMonth));
  const [appliedClientStart, setAppliedClientStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [appliedClientEnd, setAppliedClientEnd] = useState(() => getLocalDateString(lastDayOfMonth));

  const handleApplyClientFilter = () => {
    const sDate = new Date(clientHistoryStart);
    const eDate = new Date(clientHistoryEnd);
    if ((eDate - sDate) / (1000 * 60 * 60 * 24) > 31) {
      return showAlert('조회는 최대 1달(31일)까지만 가능합니다.');
    }
    setAppliedClientStart(clientHistoryStart);
    setAppliedClientEnd(clientHistoryEnd);
  };

  const handleAddOrder = () => {
    if (!newOrder.loadingLoc || !newOrder.unloadingLoc || !newOrder.loadingMonth || !newOrder.loadingDay || !newOrder.unloadingMonth || !newOrder.unloadingDay || !newOrder.productName) {
      return showAlert('필수 항목(상/하차지, 상/하차 일시, 제품명)을 모두 입력해주세요.');
    }
    if (!newOrder.managerId) {
      return showAlert('배차를 전담할 관리자(담당자)를 선택해주세요.');
    }
    
    const count = parseInt(newOrder.orderCount, 10) || 1;
    if (count < 1) return showAlert('등록 건수는 1건 이상이어야 합니다.');

    showConfirm(`입력하신 내용으로 배차를 ${count}건 요청하시겠습니까?`, () => {
      const formattedLoadingDate = `${year}-${String(newOrder.loadingMonth).padStart(2, '0')}-${String(newOrder.loadingDay).padStart(2, '0')}`;
      const formattedUnloadingDate = `${year}-${String(newOrder.unloadingMonth).padStart(2, '0')}-${String(newOrder.unloadingDay).padStart(2, '0')}`;
      const formattedLoadingTime = `${formattedLoadingDate} ${newOrder.loadingHour}:${newOrder.loadingMin}`;
      const formattedUnloadingTime = `${formattedUnloadingDate} ${newOrder.unloadingHour}:${newOrder.unloadingMin}`;

      const generatedOrders = [];
      const managerName = adminsList?.find(a => a.id === newOrder.managerId)?.name || '';

      for (let i = 0; i < count; i++) {
        const newOrderId = generateOrderId(orders, formattedLoadingDate, i);
        
        const orderData = {
          ...newOrder,
          orderCount: undefined,
          loadingTime: formattedLoadingTime,
          unloadingTime: formattedUnloadingTime,
          id: newOrderId,
          clientId: currentUser.id,
          driverId: null, 
          status: 'assigned',
          loadedAt: null,
          completedAt: null,
          requestedManager: managerName, 
          assignedBy: managerName,
          isEdited: false,
          isReassigned: false,
          yongchaVehicle: '', yongchaName: '', yongchaPhone: '', yongchaPayment: '', yongchaNotes: ''
        };
        generatedOrders.push(orderData);
      }

      addOrders(generatedOrders);

      showAlert(`새로운 배차가 ${count}건 성공적으로 요청되었습니다.\n담당 관리자가 확인 후 기사님을 배정할 예정입니다.`);
      setNewOrder({
        loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
        unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
        equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
        loadingManager: '', unloadingManager: '', notes: '', managerId: '', orderCount: 1
      });
      setClientActiveTab('history');
    });
  };

  const myOrders = orders.filter(o => {
    if (o.clientId !== currentUser.id) return false;
    if (o.loadingTime) {
      const orderDate = o.loadingTime.split(' ')[0];
      if (appliedClientStart && orderDate < appliedClientStart) return false;
      if (appliedClientEnd && orderDate > appliedClientEnd) return false;
    }
    return true;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-blue-900 border-b border-blue-950 p-3 md:p-4 sticky top-0 z-10 flex justify-between items-center shadow-md w-full shrink-0 relative">
        <div 
          className="flex items-center gap-2 shrink-0 text-white cursor-pointer hover:opacity-80 transition-opacity z-10"
          onClick={() => { handleRefresh(); setClientActiveTab('request'); }}
        >
          <Building size={24} className="shrink-0 text-blue-300"/>
          <span className="font-black text-sm md:text-lg tracking-tight mr-1 shrink-0 truncate max-w-[100px] md:max-w-none">
            {currentUser.name} {currentUser.type === '운수사' ? '운수사님' : '고객사님'}
          </span>
        </div>

        <div className="flex-1 flex justify-center items-center px-2 min-w-0">
          <span className="text-[11px] sm:text-xs md:text-sm font-bold text-blue-200 tracking-wide truncate whitespace-nowrap">
            오늘도 좋은 하루 되세요 :)
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0 z-10">
          <button onClick={handleRefresh} className="p-1.5 md:px-2 md:py-1.5 text-blue-200 hover:text-white transition-colors rounded-lg active:bg-blue-800 shrink-0 flex items-center gap-1">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">새로고침</span>
          </button>
          <button onClick={() => { setUserType(null); setCurrentUser(null); }} className="p-1.5 md:px-2 md:py-1.5 text-blue-200 hover:text-white transition-colors rounded-lg shrink-0 flex items-center gap-1">
            <LogOut size={14}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">로그아웃</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 md:pb-32 scroll-smooth w-full flex flex-col">
        <div className="p-3 md:p-6 w-full pt-4 md:pt-6">
          {clientActiveTab === 'request' ? (
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 w-full">
              <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-200 shadow-sm w-full">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <Truck className="text-blue-600"/> 신규 배차 요청
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 w-full">
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-blue-600 mb-1.5 block">상차지</label>
                    <input value={newOrder.loadingLoc} onChange={e=>setNewOrder({...newOrder, loadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="주소 입력" />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차 일시</label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-blue-600 w-full">
                          <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                          <input type="text" maxLength="2" value={newOrder.loadingMonth} onChange={e=>setNewOrder({...newOrder, loadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                          <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                          <input type="text" maxLength="2" value={newOrder.loadingDay} onChange={e=>setNewOrder({...newOrder, loadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select value={newOrder.loadingHour} onChange={e=>setNewOrder({...newOrder, loadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                          {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                        </select>
                        <select value={newOrder.loadingMin} onChange={e=>setNewOrder({...newOrder, loadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-red-600 mb-1.5 block">하차지</label>
                    <input value={newOrder.unloadingLoc} onChange={e=>setNewOrder({...newOrder, unloadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="주소 입력" />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차 일시</label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-blue-600 w-full">
                          <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                          <input type="text" maxLength="2" value={newOrder.unloadingMonth} onChange={e=>setNewOrder({...newOrder, unloadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                          <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                          <input type="text" maxLength="2" value={newOrder.unloadingDay} onChange={e=>setNewOrder({...newOrder, unloadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select value={newOrder.unloadingHour} onChange={e=>setNewOrder({...newOrder, unloadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                          {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                        </select>
                        <select value={newOrder.unloadingMin} onChange={e=>setNewOrder({...newOrder, unloadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6 w-full">
                  <div className="col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">장비 <span className="text-gray-400 font-normal">(선택)</span></label>
                    <input value={newOrder.equipment} onChange={e=>setNewOrder({...newOrder, equipment: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="예: L/B" />
                  </div>
                  <div className="col-span-1 min-w-0">
                    <label className="text-xs font-bold text-red-600 mb-1.5 block">제품명(호선)</label>
                    <input value={newOrder.productName} onChange={e=>setNewOrder({...newOrder, productName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="예: A/R 50MC" />
                  </div>
                  <div className="col-span-2 lg:col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지 담당자 <span className="text-blue-600 font-normal">(연락처)</span></label>
                    <input value={newOrder.loadingManager} onChange={e=>setNewOrder({...newOrder, loadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="예: 홍길동 010-1234-5678" />
                  </div>
                  <div className="col-span-2 lg:col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지 담당자 <span className="text-blue-600 font-normal">(연락처)</span></label>
                    <input value={newOrder.unloadingManager} onChange={e=>setNewOrder({...newOrder, unloadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="예: 이하차 주임 010-0000-0000" />
                  </div>
                </div>

                <div className="mb-4 md:mb-6 w-full">
                  <label className="text-xs font-bold text-blue-600 mb-1.5 block">제원 <span className="text-gray-400 font-normal">(단위: mm / 선택)</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-blue-600 overflow-hidden w-full">
                      <span className="px-3 md:px-4 py-3 bg-gray-100 text-blue-600 text-[14px] md:text-sm font-bold border-r border-gray-200 shrink-0">길이</span>
                      <input value={newOrder.productLength} onChange={e=>setNewOrder({...newOrder, productLength: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="12000" />
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-blue-600 overflow-hidden w-full">
                      <span className="px-3 md:px-4 py-3 bg-gray-100 text-blue-600 text-[14px] md:text-sm font-bold border-r border-gray-200 shrink-0">폭</span>
                      <input value={newOrder.productWidth} onChange={e=>setNewOrder({...newOrder, productWidth: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="2400" />
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-blue-600 overflow-hidden w-full">
                      <span className="px-3 md:px-4 py-3 bg-gray-100 text-blue-600 text-[14px] md:text-sm font-bold border-r border-gray-200 shrink-0">높이</span>
                      <input value={newOrder.productHeight} onChange={e=>setNewOrder({...newOrder, productHeight: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="2600" />
                    </div>
                  </div>
                </div>

                <div className="mb-4 md:mb-6 w-full">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">요청사항 <span className="text-gray-400 font-normal">(선택)</span></label>
                  <input value={newOrder.notes} onChange={e=>setNewOrder({...newOrder, notes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="운송사에 남길 요청사항 입력" />
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end mt-6 pt-6 border-t border-gray-100 w-full">
                  <div className="w-full md:w-32 min-w-0 shrink-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">등록 건수</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-blue-600 overflow-hidden">
                      <input type="number" min="1" value={newOrder.orderCount} onChange={e => setNewOrder({...newOrder, orderCount: parseInt(e.target.value, 10) || 1})} className="w-full p-3 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm min-w-0" />
                      <span className="pr-3 text-sm font-bold text-gray-500">건</span>
                    </div>
                  </div>
                  <div className="w-full flex-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block text-blue-700">담당자 배정 (필수)</label>
                    <select value={newOrder.managerId} onChange={e=>setNewOrder({...newOrder, managerId: e.target.value})} className="w-full p-3 border border-blue-200 rounded-lg outline-none font-bold text-[16px] md:text-sm bg-blue-50 text-blue-900 focus:ring-1 focus:ring-blue-600 truncate">
                      <option value="">관리자 선택</option>
                      {adminsList?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddOrder} className="w-full md:w-auto px-8 py-3.5 md:py-3 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-[16px] md:text-sm select-none shrink-0">배차 요청하기</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-1">
                <h2 className="text-base md:text-lg font-bold text-gray-900">우리회사 운송 내역 ({myOrders.length}건)</h2>
              </div>
              
              <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm w-full flex flex-col sm:flex-row items-center gap-2">
                 <input type="date" value={clientHistoryStart} onChange={(e) => setClientHistoryStart(e.target.value)} className="w-full sm:flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none" />
                 <span className="hidden sm:inline text-gray-400 font-bold">~</span>
                 <input type="date" value={clientHistoryEnd} onChange={(e) => setClientHistoryEnd(e.target.value)} className="w-full sm:flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none" />
                 <button onClick={handleApplyClientFilter} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-all">
                   <Search size={16}/> 조회
                 </button>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-medium bg-white rounded-2xl border shadow-sm border-gray-200 text-sm">요청하신 조건의 배차 내역이 없습니다.</div>
              ) : (
                <div className="grid gap-4 w-full">
                  {myOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-colors w-full overflow-hidden">
                      <div className="flex flex-col w-full min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {order.status === 'assigned' && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[11px] font-bold whitespace-nowrap">{order.driverId || order.driverId === 'yongcha' ? getDispatchText(order) : '배차 대기중'}</span>}
                          {order.status === 'loaded' && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[11px] font-bold whitespace-nowrap">상차완료(운송중)</span>}
                          {order.status === 'completed' && <span className="px-2 py-1 bg-gray-800 text-white rounded text-[11px] font-bold whitespace-nowrap">운송완료</span>}
                          {order.requestedManager && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">담당 요청: {order.requestedManager}</span>}
                          <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-200 ml-auto shrink-0">ORDER #{order.id}</span>
                        </div>
                        
                        <div className="text-[14px] md:text-base font-bold text-gray-800 flex flex-wrap items-center gap-1 md:gap-2 leading-tight mt-1">
                          <span className="break-keep">{order.loadingLoc}</span> <ArrowRight size={14} className="text-gray-400 shrink-0"/> <span className="break-keep">{order.unloadingLoc}</span>
                        </div>
                        <div className="text-[11px] md:text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-700">{order.equipment && `[${order.equipment}] `}{order.productName}</span> 
                          <span className="text-gray-300">|</span>
                          <span>상차예정: {formatDate(order.loadingTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="h-10 w-full opacity-0"></div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex p-2 md:p-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe h-16 md:h-[72px]">
        <button onClick={() => setClientActiveTab('request')} className={`flex flex-col items-center justify-center gap-1 transition-colors w-1/2 h-full ${clientActiveTab === 'request' ? 'text-blue-700' : 'text-gray-400'}`}>
          <Plus size={22} className="shrink-0" /><span className="text-[10px] md:text-[11px] font-bold">배차 요청</span>
        </button>
        <div className="w-px bg-gray-100 my-2"></div>
        <button onClick={() => setClientActiveTab('history')} className={`flex flex-col items-center justify-center gap-1 transition-colors w-1/2 h-full ${clientActiveTab === 'history' ? 'text-blue-700' : 'text-gray-400'}`}>
          <List size={22} className="shrink-0" /><span className="text-[10px] md:text-[11px] font-bold">운송 내역</span>
        </button>
      </nav>
    </div>
  );
};

// ==================== 4. 관리자 대시보드 컴포넌트 ====================
const AdminDashboard = ({ clients, setClients, orders, drivers, pendingDrivers, currentUser, setCurrentUser, setUserType, activeTab, setActiveTab, showAlert, showConfirm, handleRefresh, isRefreshing, addOrders, updateOrder, deleteOrder, approveDriverAction, rejectDriverAction, syncFromFirebase, addDriver, updateDriver, deleteDriver }) => {
  const [realtimeDate, setRealtimeDate] = useState(() => getLocalDateString(new Date()));
  const [realtimeMode, setRealtimeMode] = useState('board'); // 'board' (기존 뷰) | 'statusChange' (상태 변경 뷰)

  // 기사 계정 관리용 탭 및 모달 상태
  const [driverManageTab, setDriverManageTab] = useState('pending'); // 'pending', 'registered'
  const [driverFormModal, setDriverFormModal] = useState(null); // null, { mode: 'add', data: {...} }, { mode: 'edit', data: driver }

  useEffect(() => {
    window.history.pushState({ loggedIn: true }, '', '');
    const onPopState = () => {
      window.history.pushState({ loggedIn: true }, '', '');
      setActiveTab('realtime'); 
      setRealtimeMode('board');
      setSelectedDriver(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveTab]);

  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');

  const [newOrder, setNewOrder] = useState({
    clientId: '', 
    loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
    unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
    equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
    loadingManager: '', unloadingManager: '', notes: '', driverId: '', orderCount: 1,
    yongchaVehicle: '', yongchaName: '', yongchaPhone: '', yongchaPayment: '', yongchaNotes: ''
  });

  const [editingOrder, setEditingOrder] = useState(null);

  const [historyStart, setHistoryStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [historyEnd, setHistoryEnd] = useState(() => getLocalDateString(lastDayOfMonth));
  const [historyDriver, setHistoryDriver] = useState('all');
  const [historyClient, setHistoryClient] = useState('all'); 
  const [appliedHistoryStart, setAppliedHistoryStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [appliedHistoryEnd, setAppliedHistoryEnd] = useState(() => getLocalDateString(lastDayOfMonth));
  const [appliedHistoryDriver, setAppliedHistoryDriver] = useState('all');
  const [appliedHistoryClient, setAppliedHistoryClient] = useState('all');

  const handleApplyHistoryFilter = () => {
    setAppliedHistoryStart(historyStart);
    setAppliedHistoryEnd(historyEnd);
    setAppliedHistoryDriver(historyDriver);
    setAppliedHistoryClient(historyClient);
  };

  const [filterStart, setFilterStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [filterEnd, setFilterEnd] = useState(() => getLocalDateString(lastDayOfMonth));
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilterStart, setAppliedFilterStart] = useState(() => getLocalDateString(firstDayOfMonth));
  const [appliedFilterEnd, setAppliedFilterEnd] = useState(() => getLocalDateString(lastDayOfMonth));
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('all');

  const handleApplyDriverFilter = () => {
    setAppliedFilterStart(filterStart);
    setAppliedFilterEnd(filterEnd);
    setAppliedFilterStatus(filterStatus);
  };

  const [selectedDriver, setSelectedDriver] = useState(null);

  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    type: '화주', name: '', address: '', bizNo: '', manager1: '', manager2: '', phone1: '', phone2: '', notes: '', loginId: '', password: ''
  });

  const handleAddOrder = () => {
    if (!newOrder.loadingLoc || !newOrder.unloadingLoc || !newOrder.loadingMonth || !newOrder.loadingDay || !newOrder.unloadingMonth || !newOrder.unloadingDay || !newOrder.productName || !newOrder.equipment) {
      return showAlert('필수 항목(상/하차지, 상/하차 일시, 장비, 제품명(호선))을 모두 입력해주세요.');
    }
    const count = parseInt(newOrder.orderCount, 10) || 1;
    if (count < 1) return showAlert('등록 건수는 1건 이상이어야 합니다.');
    
    if (newOrder.driverId === 'yongcha') {
      if (!newOrder.yongchaVehicle || !newOrder.yongchaName) {
        return showAlert('용차 배정 시 차량번호와 기사명은 필수 입력 항목입니다.');
      }
    }

    showConfirm(`입력하신 내용으로 배차를 ${count}건 전송(등록)하시겠습니까?`, () => {
      const formattedLoadingDate = `${year}-${String(newOrder.loadingMonth).padStart(2, '0')}-${String(newOrder.loadingDay).padStart(2, '0')}`;
      const formattedUnloadingDate = `${year}-${String(newOrder.unloadingMonth).padStart(2, '0')}-${String(newOrder.unloadingDay).padStart(2, '0')}`;
      const formattedLoadingTime = `${formattedLoadingDate} ${newOrder.loadingHour}:${newOrder.loadingMin}`;
      const formattedUnloadingTime = `${formattedUnloadingDate} ${newOrder.unloadingHour}:${newOrder.unloadingMin}`;

      const generatedOrders = [];

      for (let i = 0; i < count; i++) {
        const newOrderId = generateOrderId(orders, formattedLoadingDate, i);

        const orderData = {
          ...newOrder,
          orderCount: undefined,
          loadingTime: formattedLoadingTime,
          unloadingTime: formattedUnloadingTime,
          id: newOrderId,
          driverId: count > 1 ? null : (newOrder.driverId === 'yongcha' ? 'yongcha' : (newOrder.driverId ? Number(newOrder.driverId) : null)), 
          clientId: newOrder.clientId ? Number(newOrder.clientId) : null,
          status: 'assigned',
          loadedAt: null,
          completedAt: null,
          dispatchedBy: currentUser.name, 
          requestedManager: newOrder.clientId ? '' : currentUser.name,
          isEdited: false,
          isReassigned: false,
          yongchaVehicle: newOrder.driverId === 'yongcha' ? newOrder.yongchaVehicle : '',
          yongchaName: newOrder.driverId === 'yongcha' ? newOrder.yongchaName : '',
          yongchaPhone: newOrder.driverId === 'yongcha' ? newOrder.yongchaPhone : '',
          yongchaPayment: newOrder.driverId === 'yongcha' ? newOrder.yongchaPayment : '',
          yongchaNotes: newOrder.driverId === 'yongcha' ? newOrder.yongchaNotes : '',
        };
        generatedOrders.push(orderData);
      }
      addOrders(generatedOrders);
      showAlert(`새로운 배차가 ${count}건 정상적으로 전송되었습니다.`);
      setNewOrder({
        clientId: '', loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
        unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
        equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
        loadingManager: '', unloadingManager: '', notes: '', driverId: '', orderCount: 1,
        yongchaVehicle: '', yongchaName: '', yongchaPhone: '', yongchaPayment: '', yongchaNotes: ''
      });
      setActiveTab('realtime');
      setRealtimeDate(formattedLoadingDate); 
    });
  };

  const openEditModal = (order) => {
    const parseTime = (timeStr) => {
      if (!timeStr) return { m: currentMonth, d: currentDay, h: '08', min: '00' };
      try {
        const [datePart, timePart] = timeStr.split(' ');
        const [, m, d] = datePart.split('-');
        const [h, min] = timePart.split(':');
        return { m, d, h, min };
      } catch (e) {
        return { m: currentMonth, d: currentDay, h: '08', min: '00' };
      }
    };
    const lTime = parseTime(order.loadingTime);
    const uTime = parseTime(order.unloadingTime);
    setEditingOrder({
      ...order,
      loadingMonth: lTime.m, loadingDay: lTime.d, loadingHour: lTime.h, loadingMin: lTime.min,
      unloadingMonth: uTime.m, unloadingDay: uTime.d, unloadingHour: uTime.h, unloadingMin: uTime.min,
      equipment: order.equipment || '', 
      productName: order.productName || '',
      productLength: order.productLength || '',
      productWidth: order.productWidth || '',
      productHeight: order.productHeight || '',
      notes: order.notes || '',
      driverId: order.driverId || '', 
      clientId: order.clientId || '',
      loadingManager: order.loadingManager || '', 
      unloadingManager: order.unloadingManager || '',
      yongchaVehicle: order.yongchaVehicle || '',
      yongchaName: order.yongchaName || '',
      yongchaPhone: order.yongchaPhone || '',
      yongchaPayment: order.yongchaPayment || '',
      yongchaNotes: order.yongchaNotes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingOrder.loadingLoc || !editingOrder.unloadingLoc || !editingOrder.productName || !editingOrder.equipment) {
      return showAlert('필수 항목(상/하차지, 장비, 제품명)을 모두 입력해주세요.');
    }
    
    if (editingOrder.driverId === 'yongcha') {
      if (!editingOrder.yongchaVehicle || !editingOrder.yongchaName) {
        return showAlert('용차 배정 시 차량번호와 기사명은 필수 입력 항목입니다.');
      }
    }

    const formattedLoadingTime = `${year}-${String(editingOrder.loadingMonth).padStart(2, '0')}-${String(editingOrder.loadingDay).padStart(2, '0')} ${editingOrder.loadingHour}:${editingOrder.loadingMin}`;
    const formattedUnloadingTime = `${year}-${String(editingOrder.unloadingMonth).padStart(2, '0')}-${String(editingOrder.unloadingDay).padStart(2, '0')} ${editingOrder.unloadingHour}:${editingOrder.unloadingMin}`;

    updateOrder(editingOrder.id, {
      ...editingOrder,
      loadingTime: formattedLoadingTime, unloadingTime: formattedUnloadingTime,
      driverId: editingOrder.driverId === 'yongcha' ? 'yongcha' : (editingOrder.driverId ? Number(editingOrder.driverId) : null),
      clientId: editingOrder.clientId ? Number(editingOrder.clientId) : null,
      isEdited: true, 
      isReassigned: false, 
      editedBy: currentUser.name,
      yongchaVehicle: editingOrder.driverId === 'yongcha' ? editingOrder.yongchaVehicle : '',
      yongchaName: editingOrder.driverId === 'yongcha' ? editingOrder.yongchaName : '',
      yongchaPhone: editingOrder.driverId === 'yongcha' ? editingOrder.yongchaPhone : '',
      yongchaPayment: editingOrder.driverId === 'yongcha' ? editingOrder.yongchaPayment : '',
      yongchaNotes: editingOrder.driverId === 'yongcha' ? editingOrder.yongchaNotes : '',
    });
    showAlert('운송 오더 내용이 성공적으로 수정되었습니다.');
    setEditingOrder(null);
  };

  const handleSaveNewClient = () => {
    if (!newClient.name || !newClient.loginId || !newClient.password) {
      return showAlert('고객사(운수사)명, 아이디, 비밀번호는 필수 입력 항목입니다.');
    }
    if (clients.some(c => c.loginId === newClient.loginId)) {
      return showAlert('이미 사용 중인 접속 아이디입니다.');
    }
    const clientData = { ...newClient, id: Date.now() };
    setClients([...clients, clientData]);
    showAlert(`[${newClient.name}] 등록 완료`);
    setNewClient({ type: '화주', name: '', address: '', bizNo: '', manager1: '', manager2: '', phone1: '', phone2: '', notes: '', loginId: '', password: '' });
  };

  const handleSaveEditClient = () => {
    if (!editingClient.name || !editingClient.loginId || !editingClient.password) {
      return showAlert('고객사명, 아이디, 비밀번호는 필수 입력 항목입니다.');
    }
    if (clients.some(c => c.loginId === editingClient.loginId && c.id !== editingClient.id)) {
      return showAlert('이미 다른 계정이 사용 중인 아이디입니다.');
    }
    setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
    showAlert('정보가 성공적으로 수정되었습니다.');
    setEditingClient(null);
  };

  const handleDeleteClient = (id) => {
    showConfirm('해당 고객사(운수사) 정보를 삭제하시겠습니까?', () => {
      setClients(clients.filter(c => c.id !== id));
    });
  };

  // --- 기사 계정 관리 함수 ---
  const handleSaveDriverAccount = (driverData) => {
    if (!driverData.vehicleNumber || !driverData.name || !driverData.password) {
      return showAlert('차량번호(아이디), 기사명, 비밀번호는 필수 입력 항목입니다.');
    }
    
    if (driverFormModal.mode === 'add') {
      if (drivers.some(d => d.vehicleNumber === driverData.vehicleNumber)) {
        return showAlert('이미 등록되어 있는 차량번호(아이디)입니다.');
      }
      addDriver({ ...driverData, id: Date.now() });
      showAlert(`[${driverData.name}] 기사님이 성공적으로 신규 등록되었습니다.`);
    } else {
      if (drivers.some(d => d.vehicleNumber === driverData.vehicleNumber && d.id !== driverData.id)) {
        return showAlert('이미 다른 기사님이 사용 중인 차량번호(아이디)입니다.');
      }
      updateDriver(driverData.id, driverData);
      showAlert(`[${driverData.name}] 기사님의 정보가 수정되었습니다.`);
    }
    setDriverFormModal(null);
  };

  const handleDeleteDriverAccount = (id) => {
    showConfirm('해당 기사 계정을 완전히 삭제하시겠습니까?\n(기존 운송 내역의 기사 정보는 유지됩니다.)', () => {
      deleteDriver(id);
      setDriverFormModal(null);
    });
  };
  // ---------------------------

  const handleDownloadExcel = (dataToDownload) => {
    if (!dataToDownload || dataToDownload.length === 0) {
      return showAlert('다운로드할 내역이 없습니다.');
    }
    
    const header = ["오더번호", "상태", "요청고객사", "상차지", "상차예정일시", "하차지", "하차예정일시", "차량번호", "기사명", "연락처", "결제방식", "장비", "제품명", "상차보고시간", "하차보고시간"];
    
    const rows = dataToDownload.map(order => {
      const driver = drivers.find(d => d.id === order.driverId);
      const client = clients.find(c => c.id === order.clientId);
      
      const statusStr = order.status === 'assigned' ? '배차' : order.status === 'loaded' ? '상차완료' : '운송완료';
      const clientName = client ? client.name : '직접입력';
      
      let vehicle = '미배정';
      let driverName = '-';
      let driverPhone = '-';
      let paymentInfo = '-';

      if (order.driverId === 'yongcha') {
        vehicle = order.yongchaVehicle || '용차';
        driverName = `${order.yongchaName || '이름미상'}(용차)`;
        driverPhone = order.yongchaPhone || '-';
        paymentInfo = order.yongchaPayment || '-';
      } else if (driver) {
        vehicle = driver.vehicleNumber;
        driverName = driver.name;
        driverPhone = driver.phone;
      }
      
      return [
        order.id, statusStr, clientName, 
        order.loadingLoc, formatDate(order.loadingTime), 
        order.unloadingLoc, formatDate(order.unloadingTime),
        vehicle, driverName, driverPhone, paymentInfo, order.equipment || '-', order.productName || '-',
        order.loadedAt ? formatDate(order.loadedAt) : '-', 
        order.completedAt ? formatDate(order.completedAt) : '-'
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','); 
    });

    const csvContent = "\uFEFF" + header.join(',') + "\n" + rows.join('\n'); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `현우종합운수_운송내역_${appliedHistoryStart}_${appliedHistoryEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuList = [
    { id:'realtime', icon:Grid, label:'실시간 현황 보드' },
    { id:'dispatch', icon:Plus, label:'배차 및 선등록' },
    { id:'drivers', icon:User, label:'기사별 운송내역' },
    { id:'history', icon:List, label:'전체 운송 내역 조회' },
    { id:'approvals', icon:UserPlus, label:'기사 계정 관리' }, // 메뉴명 변경됨
    { id:'clients', icon:Building, label:'고객사 관리' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 h-14 md:h-16 flex items-center justify-between px-3 md:px-6 z-20 shadow-sm shrink-0 w-full overflow-hidden">
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0 min-w-0 pr-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { handleRefresh(); setActiveTab('realtime'); setSelectedDriver(null); }}>
          <LogoSVG className="h-6 w-auto md:h-8 shrink-0" />
          <span className="text-[15px] md:text-xl font-black text-gray-900 tracking-tight mt-0.5 md:mt-1 truncate">현우종합운수</span>
          <div className="hidden sm:block h-4 md:h-5 w-px bg-gray-300 mx-1 md:mx-2 mt-1 shrink-0"></div>
          <h1 className="hidden sm:block text-xs md:text-sm font-bold text-gray-500 tracking-wide mt-1 shrink-0">통합 관제 시스템</h1>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <div className="flex items-center text-[11px] md:text-sm font-black text-blue-700 mr-1 md:mr-2 select-none truncate">
            {currentUser?.id === 'admin1' && <RankThreeStars />}
            {currentUser?.id === 'admin2' && <RankCaptain />}
            <span className="truncate">{currentUser?.name}</span>
          </div>
          <button onClick={handleRefresh} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 active:text-blue-800 px-1.5 md:px-2 py-1.5 transition-colors rounded-lg active:bg-blue-50 shrink-0">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">새로고침</span>
          </button>
          <button onClick={() => { setUserType(null); setCurrentUser(null); setActiveTab('realtime'); }} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 active:bg-gray-100 px-1.5 md:px-2 py-1.5 transition-colors rounded-lg shrink-0">
            <LogOut size={14}/>
            <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">로그아웃</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
        <nav className="lg:hidden flex overflow-x-auto bg-white border-b border-gray-200 whitespace-nowrap scrollbar-hide shrink-0 w-full">
          {menuList.map(menu => (
            <button key={menu.id} onClick={()=>{setActiveTab(menu.id); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] flex items-center gap-1.5 transition-all border-b-2 shrink-0 ${activeTab===menu.id ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <menu.icon size={16} className="shrink-0"/> <span>{menu.label}</span>
              {menu.id === 'approvals' && pendingDrivers.length > 0 && <span className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0">{pendingDrivers.length}</span>}
            </button>
          ))}
        </nav>

        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 h-full overflow-y-auto">
          <nav className="p-4 space-y-1.5 mt-2">
            {menuList.map(menu => (
              <button key={menu.id} onClick={()=>{setActiveTab(menu.id); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab===menu.id ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <menu.icon size={18} className="shrink-0"/> <span className="flex-1">{menu.label}</span>
                {menu.id === 'approvals' && pendingDrivers.length > 0 && <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full shrink-0">{pendingDrivers.length}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-3 md:p-8 overflow-y-auto bg-gray-50 w-full scroll-smooth">
          
          {/* ====== 1. 실시간 현황 보드 ====== */}
          {activeTab === 'realtime' && (() => {
            const filteredRealtimeOrders = orders.filter(o => {
              if (realtimeMode === 'board' && o.status === 'completed') return false; 
              if (o.loadingTime) {
                const orderDate = o.loadingTime.split(' ')[0];
                return orderDate === realtimeDate; 
              }
              return false;
            }).sort((a, b) => b.id - a.id);

            return (
              <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Grid className="text-blue-600"/> 실시간 현황 보드 {realtimeMode === 'board' && <span className="text-sm font-normal text-gray-500 ml-1">(미완료 건)</span>}
                  </h2>
                  <div className="flex bg-gray-200 p-1 rounded-xl w-full sm:w-64 shrink-0 shadow-inner">
                    <button onClick={() => setRealtimeMode('board')} className={`flex-1 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all ${realtimeMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>현황 보드</button>
                    <button onClick={() => setRealtimeMode('statusChange')} className={`flex-1 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all ${realtimeMode === 'statusChange' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>상태 강제 변경</button>
                  </div>
                </div>
                
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                   <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5 whitespace-nowrap">
                     조회 일자 <span className="text-[11px] md:text-xs text-blue-500 font-normal bg-blue-50 px-2 py-1 rounded border border-blue-100">(상차일 기준)</span>
                   </label>
                   <input 
                     type="date" 
                     value={realtimeDate} 
                     onChange={e => setRealtimeDate(e.target.value)} 
                     className="w-full sm:w-auto p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                   />
                </div>

                {realtimeMode === 'board' ? (
                  filteredRealtimeOrders.length === 0 ? (
                    <div className="bg-white p-10 md:p-20 rounded-2xl border border-gray-200 shadow-sm text-center">
                      <div className="text-gray-400 font-medium text-[15px] md:text-base mb-1">선택하신 날짜({realtimeDate})에</div>
                      <div className="text-gray-400 font-medium text-[15px] md:text-base">진행 중인 배차 내역이 없습니다.</div>
                      <button onClick={() => setActiveTab('dispatch')} className="mt-5 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">새 배차 등록하기</button>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:gap-4 w-full">
                      {filteredRealtimeOrders.map(order => {
                        const driver = drivers.find(d => d.id === order.driverId);
                        const client = clients.find(c => c.id === order.clientId);
                        const requestedAdminName = order.requestedManager || order.assignedBy;
                        const isYongcha = order.driverId === 'yongcha';

                        return (
                          <div key={order.id} className={`bg-white p-4 md:p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors w-full overflow-hidden ${isYongcha ? 'border-purple-200 hover:border-purple-400 bg-purple-50/10' : 'border-gray-200 hover:border-gray-900'}`}>
                            <div className="flex items-start md:items-center gap-3 md:gap-6 w-full md:w-auto min-w-0">
                              <div className={`text-center w-28 md:w-36 border-r pr-3 md:pr-4 shrink-0 flex flex-col justify-center ${isYongcha ? 'border-purple-100' : 'border-gray-100'}`}>
                                 {isYongcha ? (
                                   <>
                                     <div className="font-black text-[15px] md:text-xl text-purple-700 whitespace-nowrap w-full truncate">{order.yongchaVehicle || '차량미상'}</div>
                                     <div className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5 whitespace-nowrap w-full flex justify-center items-center gap-1">
                                       <span className="text-[10px] text-purple-600 border border-purple-200 bg-purple-100 px-1 py-0.5 rounded">용차</span>
                                       <span className="truncate max-w-[80px]">{order.yongchaName || '기사명 미상'}</span>
                                     </div>
                                   </>
                                 ) : driver ? (
                                   <>
                                     <div className="font-black text-[15px] md:text-xl text-blue-700 whitespace-nowrap w-full">{driver.vehicleNumber}</div>
                                     <div className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5 whitespace-nowrap w-full">{driver.name} 기사님</div>
                                   </>
                                 ) : (
                                   <div className="font-black text-[12px] md:text-sm text-gray-400 py-1 inline-block whitespace-nowrap">기사 미배정</div>
                                 )}
                                 
                                 <div className="mt-2.5 md:mt-3 w-full">
                                   {!order.driverId ? (
                                      <div className="bg-red-50 border border-red-200 text-red-600 text-[11px] md:text-xs font-black py-1.5 rounded-lg w-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">배차 대기중</div>
                                   ) : order.status === 'assigned' ? (
                                      <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 text-[11px] md:text-xs font-black py-1.5 rounded-lg w-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">배차됨 (상차전)</div>
                                   ) : order.status === 'loaded' ? (
                                      <div className="bg-blue-600 border border-blue-700 text-white text-[11px] md:text-xs font-black py-1.5 rounded-lg w-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">상차완료 (운송중)</div>
                                   ) : null}
                                 </div>

                                 {order.driverId && order.status === 'assigned' && (
                                   <div className="text-[10px] text-gray-400 mt-1.5 font-medium truncate w-full">{getDispatchText(order)}</div>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex gap-2 items-center mb-1 flex-wrap">
                                  {client && <span className="bg-blue-100 text-blue-800 text-[10px] md:text-[11px] px-2 py-1 rounded font-bold whitespace-nowrap">요청: {client.name}</span>}
                                  {requestedAdminName && <span className="bg-purple-100 text-purple-800 text-[10px] md:text-[11px] px-2 py-1 rounded font-bold whitespace-nowrap border border-purple-200">담당: {requestedAdminName}</span>}
                                  <span className="ml-auto text-[10px] md:text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">ORDER #{order.id}</span>
                                </div>
                                <div className="text-[14px] md:text-base font-bold text-gray-800 flex flex-wrap items-center gap-1 md:gap-2 leading-tight mt-1.5">
                                  <span className="break-keep">{order.loadingLoc}</span> <ArrowRight size={14} className="text-gray-400 shrink-0"/> <span className="break-keep">{order.unloadingLoc}</span>
                                </div>
                                <div className="text-[11px] md:text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                  <span className="font-bold text-gray-700 truncate max-w-full">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</span> 
                                </div>
                              </div>
                            </div>
                            <div className="flex w-full md:w-auto gap-2 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 justify-end shrink-0">
                               <button onClick={() => openEditModal(order)} className="text-gray-500 hover:text-blue-600 px-3 py-2 bg-gray-50 active:scale-90 md:bg-transparent rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold border border-gray-200 md:border-transparent shrink-0">
                                 <Edit size={16}/> <span className="hidden sm:inline">수정</span>
                               </button>
                               <select 
                                 value=""
                                 onChange={(e) => {
                                   if(!e.target.value) return;
                                   if(e.target.value === 'unassign') {
                                     showConfirm(`해당 배차를 '미배정' 상태로 변경하시겠습니까?`, () => {
                                       updateOrder(order.id, { driverId: null, isEdited: true, isReassigned: false, editedBy: currentUser.name });
                                     });
                                     return;
                                   }
                                   if(e.target.value === 'yongcha_alert') {
                                     showAlert('용차 배정은 [수정] 버튼을 눌러 차량번호, 기사명 등 상세 내역을 직접 입력해주세요.');
                                     e.target.value = '';
                                     return;
                                   }

                                   const targetDriverId = Number(e.target.value);
                                   const targetDriver = drivers.find(d => d.id === targetDriverId);
                                   showConfirm(`해당 배차를 '${targetDriver.vehicleNumber}' 기사님께 배정/이관하시겠습니까?`, () => {
                                     updateOrder(order.id, { 
                                        driverId: targetDriverId, 
                                        status: 'assigned', 
                                        loadedAt: null, 
                                        completedAt: null, 
                                        isReassigned: true,
                                        isEdited: false, 
                                        reassignedBy: currentUser.name, 
                                        reassignedAt: new Date().toISOString() 
                                     });
                                   });
                                 }}
                                 className="text-xs md:text-sm font-bold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-2.5 md:py-2 rounded-lg outline-none cursor-pointer text-center max-w-[140px]"
                               >
                                 <option value="">기사 배정/이관</option>
                                 <option value="unassign">미배정</option>
                                 {drivers.filter(d => d.id !== order.driverId).map(d => <option key={d.id} value={d.id}>{d.vehicleNumber}</option>)}
                                 <option value="yongcha_alert" className="font-bold text-purple-600">🚚 용차 전환 (수정 필요)</option>
                               </select>
                               <button onClick={() => showConfirm('해당 배차를 삭제하시겠습니까?', () => deleteOrder(order.id))} className="text-gray-400 hover:text-red-500 p-2.5 bg-gray-50 md:bg-transparent rounded-lg shrink-0"><Trash2 size={18}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full">
                     <table className="w-full text-sm text-left min-w-[700px]">
                       <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs w-28 text-center">오더번호</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs w-32 text-center">기사/차량</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs">상/하차지 및 제품</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs w-32 text-center">현재 상태</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs w-36 text-center">상태 강제 변경</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {filteredRealtimeOrders.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-400">조회된 오더가 없습니다.</td></tr>
                         ) : (
                           filteredRealtimeOrders.map(order => {
                             const driver = drivers.find(d => d.id === order.driverId);
                             const isYongcha = order.driverId === 'yongcha';
                             const vehicleText = isYongcha ? (order.yongchaVehicle || '용차') : (driver ? driver.vehicleNumber : '미배정');

                             return (
                               <tr key={order.id} className="hover:bg-gray-50">
                                 <td className="p-3 md:p-4 align-middle text-center whitespace-nowrap">
                                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">#{order.id}</span>
                                 </td>
                                 <td className="p-3 md:p-4 align-middle text-center whitespace-nowrap">
                                    <span className={`font-bold text-xs ${!order.driverId ? 'text-red-500' : isYongcha ? 'text-purple-600' : 'text-blue-700'}`}>{vehicleText}</span>
                                 </td>
                                 <td className="p-3 md:p-4 text-gray-600 text-[12px] md:text-[13px]">
                                    <div className="flex items-center gap-1 break-keep text-gray-800 font-bold mb-1">
                                      <span>{order.loadingLoc}</span> <ArrowRight size={12} className="text-gray-400 shrink-0"/> <span>{order.unloadingLoc}</span>
                                    </div>
                                    <div className="text-gray-500 truncate">{order.equipment && `[${order.equipment}] `}{order.productName}</div>
                                 </td>
                                 <td className="p-3 md:p-4 align-middle text-center whitespace-nowrap">
                                    {order.status === 'assigned' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-[11px] font-bold border border-yellow-200">배차 (상차전)</span>}
                                    {order.status === 'loaded' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold border border-blue-200">상차완료 (운송중)</span>}
                                    {order.status === 'completed' && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[11px] font-bold border border-gray-200">운송완료</span>}
                                 </td>
                                 <td className="p-3 md:p-4 align-middle text-center">
                                    <select
                                      value={order.status}
                                      onChange={(e) => {
                                        const newStatus = e.target.value;
                                        if (newStatus === order.status) return;
                                        if (!order.driverId && newStatus !== 'assigned') {
                                          return showAlert('기사가 배정되지 않은 오더는 상태를 변경할 수 없습니다. 배차를 먼저 진행해주세요.');
                                        }
                                        const statusLabel = newStatus === 'assigned' ? '배차 (상차전)' : newStatus === 'loaded' ? '상차완료 (운송중)' : '운송완료';
                                        showConfirm(`[ORDER #${order.id}]\n해당 운송 건을 '${statusLabel}' 상태로 강제 변경하시겠습니까?`, () => {
                                           let updates = { status: newStatus };
                                           if (newStatus === 'loaded') updates.loadedAt = new Date().toISOString();
                                           if (newStatus === 'completed') {
                                             if (!order.loadedAt) updates.loadedAt = new Date().toISOString();
                                             updates.completedAt = new Date().toISOString();
                                           }
                                           updateOrder(order.id, updates);
                                        });
                                      }}
                                      className="text-xs font-bold bg-white border border-gray-300 text-gray-700 px-2 py-1.5 rounded outline-none cursor-pointer w-full focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm hover:border-blue-400"
                                    >
                                      <option value="assigned">👉 배차 (상차전)</option>
                                      <option value="loaded">👉 상차완료 (운송중)</option>
                                      <option value="completed">👉 운송완료</option>
                                    </select>
                                 </td>
                               </tr>
                             )
                           })
                         )}
                       </tbody>
                     </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ====== 2. 배차 및 선등록 ====== */}
          {activeTab === 'dispatch' && (
            <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 w-full">
              <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-200 shadow-sm w-full">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">신규 배차 (선등록)</h2>
                
                <div className="mb-4 md:mb-6 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">요청 고객사/운수사 <span className="text-gray-400 font-normal">(선택 - 고객사 앱 연동용)</span></label>
                  <select value={newOrder.clientId} onChange={e=>setNewOrder({...newOrder, clientId: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none font-bold text-[16px] md:text-sm bg-white focus:border-gray-900">
                    <option value="">고객사 미지정 (직접 입력 건)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>[{c.type || '화주'}] {c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 w-full">
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-blue-600 mb-1.5 block">상차지</label>
                    <input value={newOrder.loadingLoc} onChange={e=>setNewOrder({...newOrder, loadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm" placeholder="주소 입력" />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차 일시</label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                         <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                         <input type="text" maxLength="2" value={newOrder.loadingMonth} onChange={e=>setNewOrder({...newOrder, loadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="월" />
                         <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                         <input type="text" maxLength="2" value={newOrder.loadingDay} onChange={e=>setNewOrder({...newOrder, loadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="일" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select value={newOrder.loadingHour} onChange={e=>setNewOrder({...newOrder, loadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900">
                          {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                        </select>
                        <select value={newOrder.loadingMin} onChange={e=>setNewOrder({...newOrder, loadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900">
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-red-600 mb-1.5 block">하차지</label>
                    <input value={newOrder.unloadingLoc} onChange={e=>setNewOrder({...newOrder, unloadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm" placeholder="주소 입력" />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차 일시</label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                         <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                         <input type="text" maxLength="2" value={newOrder.unloadingMonth} onChange={e=>setNewOrder({...newOrder, unloadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="월" />
                         <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                         <input type="text" maxLength="2" value={newOrder.unloadingDay} onChange={e=>setNewOrder({...newOrder, unloadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="일" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select value={newOrder.unloadingHour} onChange={e=>setNewOrder({...newOrder, unloadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900">
                          {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                        </select>
                        <select value={newOrder.unloadingMin} onChange={e=>setNewOrder({...newOrder, unloadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900">
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6 w-full">
                  <div className="col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">장비</label>
                    <input value={newOrder.equipment} onChange={e=>setNewOrder({...newOrder, equipment: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900" placeholder="예: L/B" />
                  </div>
                  <div className="col-span-1 min-w-0">
                    <label className="text-xs font-bold text-red-600 mb-1.5 block">제품명(호선)</label>
                    <input value={newOrder.productName} onChange={e=>setNewOrder({...newOrder, productName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900" placeholder="예: A/R 50MC" />
                  </div>
                  <div className="col-span-2 lg:col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지 담당자 <span className="text-gray-400 font-normal">(연락처)</span></label>
                    <input value={newOrder.loadingManager} onChange={e=>setNewOrder({...newOrder, loadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900" placeholder="예: 홍길동 010-1234-5678" />
                  </div>
                  <div className="col-span-2 lg:col-span-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지 담당자 <span className="text-gray-400 font-normal">(연락처)</span></label>
                    <input value={newOrder.unloadingManager} onChange={e=>setNewOrder({...newOrder, unloadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900" placeholder="예: 이하차 주임 010-0000-0000" />
                  </div>
                </div>

                <div className="mb-4 md:mb-6 w-full">
                  <label className="text-xs font-bold text-blue-600 mb-1.5 block">제원 <span className="text-gray-400 font-normal">(mm)</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-gray-900">
                      <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">길이</span>
                      <input value={newOrder.productLength} onChange={e=>setNewOrder({...newOrder, productLength: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-gray-900">
                      <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">폭</span>
                      <input value={newOrder.productWidth} onChange={e=>setNewOrder({...newOrder, productWidth: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-gray-900">
                      <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">높이</span>
                      <input value={newOrder.productHeight} onChange={e=>setNewOrder({...newOrder, productHeight: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                    </div>
                  </div>
                </div>

                <div className="mb-4 md:mb-6 w-full">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">주의사항</label>
                  <input value={newOrder.notes} onChange={e=>setNewOrder({...newOrder, notes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900" placeholder="특이사항 입력" />
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end mt-6 pt-6 border-t border-gray-100 w-full">
                  <div className="w-full md:w-32 min-w-0 shrink-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">등록 건수</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <input type="number" min="1" value={newOrder.orderCount} onChange={e => setNewOrder({...newOrder, orderCount: parseInt(e.target.value, 10) || 1, driverId: parseInt(e.target.value, 10) > 1 ? '' : newOrder.driverId})} className="w-full p-3 bg-transparent outline-none text-center font-bold text-gray-900" />
                      <span className="pr-3 text-sm font-bold text-gray-500">건</span>
                    </div>
                  </div>
                  <div className="w-full flex-1 min-w-0">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">기사 배정</label>
                    <select value={newOrder.orderCount > 1 ? '' : newOrder.driverId} onChange={e=>setNewOrder({...newOrder, driverId: e.target.value})} disabled={newOrder.orderCount > 1} className={`w-full p-3 border rounded-lg outline-none font-bold focus:ring-1 focus:ring-gray-900 ${newOrder.driverId === 'yongcha' ? 'border-purple-300 bg-purple-50 text-purple-800' : 'border-gray-200 bg-gray-50'}`}>
                      <option value="">선등록 (기사 미배정)</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                      <option value="yongcha" className="font-bold text-purple-700">🚚 용차 (외부 기사)</option>
                    </select>
                  </div>
                  <button onClick={handleAddOrder} className="w-full md:w-auto px-8 py-3.5 md:py-3 bg-gray-900 text-white rounded-lg font-bold shadow-sm hover:bg-gray-800">배차 전송</button>
                </div>

                {newOrder.driverId === 'yongcha' && (
                  <div className="w-full mt-4 p-5 border border-purple-200 bg-purple-50 rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">용차 정보 입력</span>
                       <span className="text-xs text-purple-800 font-bold">배차할 외부 기사님의 상세 정보를 입력해주세요.</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                       <div>
                         <label className="text-xs font-bold text-purple-800 mb-1 block">차량번호 *</label>
                         <input value={newOrder.yongchaVehicle} onChange={e=>setNewOrder({...newOrder, yongchaVehicle: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 11가1111" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-purple-800 mb-1 block">기사명 *</label>
                         <input value={newOrder.yongchaName} onChange={e=>setNewOrder({...newOrder, yongchaName: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 홍길동" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-purple-800 mb-1 block">연락처</label>
                         <input value={newOrder.yongchaPhone} onChange={e=>setNewOrder({...newOrder, yongchaPhone: formatPhoneStr(e.target.value)})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 010-1234-5678" />
                       </div>
                       <div className="sm:col-span-2 lg:col-span-1">
                         <label className="text-xs font-bold text-purple-800 mb-1 block">결제방식/결제금액</label>
                         <input value={newOrder.yongchaPayment} onChange={e=>setNewOrder({...newOrder, yongchaPayment: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 인수증 15만" />
                       </div>
                       <div className="sm:col-span-2 lg:col-span-2">
                         <label className="text-xs font-bold text-purple-800 mb-1 block">기타사항</label>
                         <input value={newOrder.yongchaNotes} onChange={e=>setNewOrder({...newOrder, yongchaNotes: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="용차 관련 메모" />
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (() => {
            const filteredHistory = orders.filter(o => {
              if (appliedHistoryDriver === 'yongcha' && o.driverId !== 'yongcha') return false;
              else if (appliedHistoryDriver === 'unassigned' && o.driverId !== null) return false;
              else if (appliedHistoryDriver !== 'all' && appliedHistoryDriver !== 'unassigned' && appliedHistoryDriver !== 'yongcha' && o.driverId !== Number(appliedHistoryDriver)) return false;
              
              if (appliedHistoryClient !== 'all' && o.clientId !== Number(appliedHistoryClient)) return false;

              if (o.loadingTime) {
                const orderDate = o.loadingTime.split(' ')[0];
                if (appliedHistoryStart && orderDate < appliedHistoryStart) return false;
                if (appliedHistoryEnd && orderDate > appliedHistoryEnd) return false;
              }
              return true;
            }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

            return (
              <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">전체 운송 내역 조회</h2>
                  <button onClick={() => handleDownloadExcel(filteredHistory)} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 px-4 py-2.5 md:py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95">
                    <Download size={16}/> 엑셀 다운로드
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">
                  <div className="w-full lg:w-auto flex gap-3 md:gap-4 flex-col sm:flex-row">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">시작일</label>
                      <input type="date" value={historyStart} onChange={e=>setHistoryStart(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">종료일</label>
                      <input type="date" value={historyEnd} onChange={e=>setHistoryEnd(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                  </div>
                  <div className="w-full lg:w-auto flex-1 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">고객사 필터</label>
                      <select value={historyClient} onChange={e=>setHistoryClient(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="all">전체 고객사</option>
                        {clients.map(c => <option key={c.id} value={c.id}>[{c.type || '화주'}] {c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">기사 선택</label>
                      <select value={historyDriver} onChange={e=>setHistoryDriver(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="all">전체 기사 보기</option>
                        <option value="unassigned">미배정 건 보기</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                        <option value="yongcha" className="text-purple-700 font-bold">🚚 용차 건 보기</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleApplyHistoryFilter} className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg shadow-sm hover:bg-gray-800 flex items-center justify-center gap-1.5 transition-all">
                    <Search size={16}/> 조회
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full">
                   <table className="w-full text-sm text-left min-w-[950px]">
                     <thead className="bg-gray-50 border-b border-gray-200">
                       <tr>
                         <th className="p-4 font-bold text-gray-500 text-xs w-36">고객사/배차정보</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-36">실제 처리시간</th>
                         <th className="p-4 font-bold text-gray-500 text-xs">운송경로</th>
                         <th className="p-4 font-bold text-gray-500 text-xs">장비 / 제품명</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-28 text-center">오더번호</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-20 text-center">관리</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredHistory.length === 0 ? (
                          <tr><td colSpan="6" className="p-10 text-center text-gray-400">내역이 없습니다.</td></tr>
                       ) : (
                         filteredHistory.map(order => {
                           const driver = drivers.find(d => d.id === order.driverId);
                           const client = clients.find(c => c.id === order.clientId);
                           const requestedAdminName = order.requestedManager || order.assignedBy;
                           const isYongcha = order.driverId === 'yongcha';
                           
                           return (
                             <tr key={order.id} className="hover:bg-gray-50">
                               <td className="p-4 whitespace-nowrap">
                                  <div className="mb-1.5 flex items-center gap-2">
                                    {isYongcha ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-base font-black text-purple-700">{order.yongchaVehicle || '차량미상'}</span>
                                        <span className="text-[10px] bg-purple-100 border border-purple-200 text-purple-700 px-1 py-0.5 rounded font-bold">용차</span>
                                      </div>
                                    ) : driver ? (
                                      <span className="text-base font-black text-blue-700">{driver.vehicleNumber}</span>
                                    ) : (
                                      <span className="text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs font-bold">미배정</span>
                                    )}
                                    <div className="flex gap-1">
                                      {order.status === 'assigned' && <span className="px-2 py-0.5 bg-white border border-gray-300 text-gray-800 rounded text-[11px] font-bold shadow-sm">{getDispatchText(order)}</span>}
                                      {order.status === 'loaded' && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold shadow-sm">상차완료</span>}
                                      {order.status === 'completed' && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[11px] font-bold">운송완료</span>}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-0.5">
                                    {client && <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100">요청: {client.name}</div>}
                                    {requestedAdminName && <div className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block border border-purple-100">담당: {requestedAdminName}</div>}
                                    {isYongcha && order.yongchaName && <div className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block border border-gray-200">기사: {order.yongchaName}</div>}
                                  </div>
                               </td>
                               <td className="p-4 text-xs whitespace-nowrap">
                                 <div className="text-gray-500 mb-1">상차: <span className="font-bold text-blue-600">{order.loadedAt ? formatDate(order.loadedAt) : '대기중'}</span></div>
                                 <div className="text-gray-500">하차: <span className="font-bold text-gray-800">{order.completedAt ? formatDate(order.completedAt) : '대기중'}</span></div>
                               </td>
                               <td className="p-4 text-gray-600 text-[13px]"><div className="flex items-center gap-1 break-keep"><span>{order.loadingLoc}</span> <ArrowRight size={12}/> <span>{order.unloadingLoc}</span></div></td>
                               <td className="p-4"><div className="text-gray-800 font-bold break-keep">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</div></td>
                               <td className="p-4 align-middle text-center whitespace-nowrap">
                                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">ORDER #{order.id}</span>
                               </td>
                               <td className="p-4 align-middle text-center"><button onClick={() => showConfirm('해당 배차를 삭제하시겠습니까?', () => deleteOrder(order.id))} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16}/></button></td>
                             </tr>
                           )
                         })
                       )}
                     </tbody>
                   </table>
                </div>
              </div>
            );
          })()}

          {/* ====== 기사 계정 관리 (기존 가입 승인 포함) ====== */}
          {activeTab === 'approvals' && (
            <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="text-blue-600"/> 기사 계정 관리
                </h2>
                <div className="flex bg-gray-200 p-1 rounded-xl w-full sm:w-64 shrink-0 shadow-inner">
                  <button onClick={() => setDriverManageTab('pending')} className={`flex-1 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all ${driverManageTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    가입 대기 ({pendingDrivers.length})
                  </button>
                  <button onClick={() => setDriverManageTab('registered')} className={`flex-1 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all ${driverManageTab === 'registered' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    등록된 기사 ({drivers.length})
                  </button>
                </div>
              </div>

              {driverManageTab === 'pending' ? (
                <>
                  {pendingDrivers.length === 0 ? <div className="bg-white p-10 rounded-2xl border text-center text-gray-400">대기 중인 가입 신청 내역이 없습니다.</div> : (
                    <div className="grid gap-4 w-full">
                      {pendingDrivers.map(driver => (
                        <div key={driver.id} className="bg-white p-4 md:p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                          <div className="flex gap-4 items-center w-full md:w-auto">
                             <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0"><User size={24}/></div>
                             <div className="min-w-0">
                               <div className="text-lg font-black text-gray-900">{driver.vehicleNumber}</div>
                               <div className="text-sm font-bold text-gray-500">{driver.name} | {driver.phone}</div>
                             </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button onClick={() => rejectDriverAction(driver.id)} className="flex-1 md:flex-none border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 active:bg-gray-100">반려</button>
                            <button onClick={() => approveDriverAction(driver)} className="flex-1 md:flex-none bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 active:scale-95 transition-all">승인하기</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 w-full">
                   <div className="flex justify-end">
                      <button onClick={() => setDriverFormModal({ mode: 'add', data: { vehicleNumber: '', name: '', phone: '', password: '', chassisType: '' }})} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm active:scale-95 transition-all">
                        <Plus size={16}/> 신규 기사 직접 등록
                      </button>
                   </div>
                   
                   {drivers.length === 0 ? <div className="bg-white p-10 rounded-2xl border text-center text-gray-400">등록된 기사 계정이 없습니다.</div> : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                       {drivers.map(driver => (
                         <div key={driver.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between gap-4 w-full hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3 w-full">
                                 <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><User size={24}/></div>
                                 <div className="min-w-0 flex-1">
                                   <div className="text-lg font-black text-gray-900 truncate">{driver.vehicleNumber}</div>
                                   <div className="text-xs font-bold text-gray-500 truncate">{driver.name} | {driver.phone || '연락처 미상'}</div>
                                 </div>
                               </div>
                            </div>
                            <div className="text-[11px] md:text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg flex flex-col gap-1.5 border border-gray-100">
                               <div className="flex justify-between">
                                 <span className="font-bold">차종/제원:</span>
                                 <span>{driver.chassisType || '미입력'}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="font-bold">비밀번호:</span>
                                 <span className="text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono tracking-wider">{driver.password}</span>
                               </div>
                            </div>
                            <button onClick={() => setDriverFormModal({ mode: 'edit', data: driver })} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                              <Edit size={16}/> 정보 및 비밀번호 수정
                            </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'drivers' && !selectedDriver && (
            <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
              <h2 className="text-base md:text-lg font-bold text-gray-900">기사별 운송내역</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {drivers.map(driver => {
                  const todayStr = `${year}-${currentMonth}-${currentDay}`;
                  const monthStr = `${year}-${currentMonth}`;
                  const driverMonthlyCompleted = orders.filter(o => o.driverId === driver.id && o.status === 'completed' && o.loadingTime && o.loadingTime.startsWith(monthStr)).length;
                  const driverTodayOrders = orders.filter(o => o.driverId === driver.id && o.loadingTime && o.loadingTime.startsWith(todayStr));
                  const driverTodayAssigned = driverTodayOrders.filter(o => o.status !== 'completed').length;
                  const driverTodayCompleted = driverTodayOrders.filter(o => o.status === 'completed').length;

                  return (
                  <div key={driver.id} onClick={() => setSelectedDriver(driver)} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-gray-900 transition-all group">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition"><User size={20} /></div>
                      <div className="min-w-0">
                        <div className="text-lg font-black text-blue-700 truncate">{driver.vehicleNumber}</div>
                        <div className="text-sm font-bold text-gray-500 truncate">{driver.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-[13px] border-t border-gray-100 pt-3">
                       <div className="flex justify-between items-center gap-2">
                         <span className="text-gray-500 shrink-0">월누적:</span>
                         <span className="text-gray-800 font-medium truncate">완료 <b className="text-blue-600">{driverMonthlyCompleted}</b>건</span>
                       </div>
                       <div className="flex justify-between items-center gap-2">
                         <span className="text-gray-500 shrink-0">오늘:</span>
                         <span className="text-gray-800 font-medium truncate">배차 <b className="text-orange-500">{driverTodayAssigned}</b>건 <span className="mx-1 text-gray-300">/</span> 완료 <b className="text-blue-600">{driverTodayCompleted}</b>건</span>
                       </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {activeTab === 'drivers' && selectedDriver && (() => {
              const filteredOrders = orders.filter(o => {
                if (o.driverId !== selectedDriver.id) return false;
                if (appliedFilterStatus !== 'all' && o.status !== appliedFilterStatus) return false;
                if (o.loadingTime) {
                  const orderDate = o.loadingTime.split(' ')[0];
                  if (appliedFilterStart && orderDate < appliedFilterStart) return false;
                  if (appliedFilterEnd && orderDate > appliedFilterEnd) return false;
                }
                return true;
              }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

              return (
             <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
               <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => setSelectedDriver(null)} className="p-2 bg-white border rounded-lg text-gray-600 shadow-sm"><ArrowLeft size={18}/></button>
                 <h2 className="text-lg font-bold text-gray-900">{selectedDriver.vehicleNumber} ({selectedDriver.name}) 운송 내역</h2>
               </div>
               
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">
                  <div className="w-full lg:w-auto flex gap-3 md:gap-4 flex-col sm:flex-row">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">시작일</label>
                      <input type="date" value={filterStart} onChange={e=>setFilterStart(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">종료일</label>
                      <input type="date" value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                  </div>
                  <div className="w-full lg:w-auto flex-1 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">상태 필터</label>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="all">전체 상태 보기</option>
                        <option value="assigned">배차 대기/진행중</option>
                        <option value="loaded">상차완료</option>
                        <option value="completed">운송완료</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleApplyDriverFilter} className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg shadow-sm hover:bg-gray-800 flex items-center justify-center gap-1.5 transition-all">
                    <Search size={16}/> 조회
                  </button>
               </div>

               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full">
                   <table className="w-full text-sm text-left min-w-[950px]">
                     <thead className="bg-gray-50 border-b border-gray-200">
                       <tr>
                         <th className="p-4 font-bold text-gray-500 text-xs w-36">고객사/배차정보</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-36">실제 처리시간</th>
                         <th className="p-4 font-bold text-gray-500 text-xs">운송경로</th>
                         <th className="p-4 font-bold text-gray-500 text-xs">장비 / 제품명</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-28 text-center">오더번호</th>
                         <th className="p-4 font-bold text-gray-500 text-xs w-20 text-center">관리</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredOrders.length === 0 ? (
                          <tr><td colSpan="6" className="p-10 text-center text-gray-400">내역이 없습니다.</td></tr>
                       ) : (
                         filteredOrders.map(order => {
                           const driver = drivers.find(d => d.id === order.driverId);
                           const client = clients.find(c => c.id === order.clientId);
                           const requestedAdminName = order.requestedManager || order.assignedBy;

                           return (
                             <tr key={order.id} className="hover:bg-gray-50">
                               <td className="p-4 whitespace-nowrap">
                                  <div className="mb-1.5 flex items-center gap-2">
                                    {driver ? (
                                      <span className="text-base font-black text-blue-700">{driver.vehicleNumber}</span>
                                    ) : (
                                      <span className="text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs font-bold">미배정</span>
                                    )}
                                    <div className="flex gap-1">
                                      {order.status === 'assigned' && <span className="px-2 py-0.5 bg-white border border-gray-300 text-gray-800 rounded text-[11px] font-bold shadow-sm">{getDispatchText(order)}</span>}
                                      {order.status === 'loaded' && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold shadow-sm">상차완료</span>}
                                      {order.status === 'completed' && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[11px] font-bold">운송완료</span>}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-0.5">
                                    {client && <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100">요청: {client.name}</div>}
                                    {requestedAdminName && <div className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block border border-purple-100">담당: {requestedAdminName}</div>}
                                  </div>
                               </td>
                               <td className="p-4 text-xs whitespace-nowrap">
                                 <div className="text-gray-500 mb-1">상차: <span className="font-bold text-blue-600">{order.loadedAt ? formatDate(order.loadedAt) : '대기중'}</span></div>
                                 <div className="text-gray-500">하차: <span className="font-bold text-gray-800">{order.completedAt ? formatDate(order.completedAt) : '대기중'}</span></div>
                               </td>
                               <td className="p-4 text-gray-600 text-[13px]"><div className="flex items-center gap-1 break-keep"><span>{order.loadingLoc}</span> <ArrowRight size={12}/> <span>{order.unloadingLoc}</span></div></td>
                               <td className="p-4"><div className="text-gray-800 font-bold break-keep">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</div></td>
                               <td className="p-4 align-middle text-center whitespace-nowrap">
                                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">ORDER #{order.id}</span>
                               </td>
                               <td className="p-4 align-middle text-center"><button onClick={() => showConfirm('해당 배차를 삭제하시겠습니까?', () => deleteOrder(order.id))} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16}/></button></td>
                             </tr>
                           )
                         })
                       )}
                     </tbody>
                   </table>
               </div>
             </div>
             );
            })()}
        </main>
      </div>

      {/* 기사 계정 수정 및 신규 등록 모달 */}
      {driverFormModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full my-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              {driverFormModal.mode === 'add' ? <UserPlus size={20} className="text-blue-600"/> : <Edit size={20} className="text-blue-600"/>}
              {driverFormModal.mode === 'add' ? '신규 기사 직접 등록' : '기사 정보 및 비밀번호 수정'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">차량번호 (접속 아이디)</label>
                <input value={driverFormModal.data.vehicleNumber} onChange={e=>setDriverFormModal({...driverFormModal, data: {...driverFormModal.data, vehicleNumber: e.target.value}})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 font-bold text-[15px]" placeholder="예: 82가1234"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">기사님 성함</label>
                <input value={driverFormModal.data.name} onChange={e=>setDriverFormModal({...driverFormModal, data: {...driverFormModal.data, name: e.target.value}})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 font-bold text-[15px]" placeholder="예: 홍길동"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">연락처</label>
                <input value={driverFormModal.data.phone || ''} onChange={e=>setDriverFormModal({...driverFormModal, data: {...driverFormModal.data, phone: formatPhoneStr(e.target.value)}})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 font-bold text-[15px]" placeholder="예: 010-1234-5678"/>
              </div>
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1.5">비밀번호</label>
                <input value={driverFormModal.data.password} onChange={e=>setDriverFormModal({...driverFormModal, data: {...driverFormModal.data, password: e.target.value}})} className="w-full p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 font-bold text-[15px]" placeholder="로그인 비밀번호"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">차종 및 제원 (선택사항)</label>
                <input value={driverFormModal.data.chassisType || ''} onChange={e=>setDriverFormModal({...driverFormModal, data: {...driverFormModal.data, chassisType: e.target.value}})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[15px]" placeholder="예: 가변형 평판 25톤"/>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
              {driverFormModal.mode === 'edit' && (
                <button onClick={() => handleDeleteDriverAccount(driverFormModal.data.id)} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold mr-auto hover:bg-red-100 active:scale-95 flex items-center gap-1 transition-all"><Trash2 size={16}/> 삭제</button>
              )}
              <button onClick={() => setDriverFormModal(null)} className="px-5 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-700 hover:bg-gray-200 transition-all">취소</button>
              <button onClick={() => handleSaveDriverAccount(driverFormModal.data)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
                {driverFormModal.mode === 'add' ? '기사 등록 완료' : '정보 수정 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고객사 수정 모달 (확장) */}
      {editingClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full my-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit size={20} className="text-blue-600"/> 고객사(운수사) 정보 수정</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block">구분</label>
                <select value={editingClient.type || '화주'} onChange={e=>setEditingClient({...editingClient, type:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold">
                  <option value="화주">화주</option>
                  <option value="운수사">운수사</option>
                </select>
              </div>
              <div className="sm:col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 block">고객사(운수사)명</label>
                <input value={editingClient.name} onChange={e=>setEditingClient({...editingClient, name:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block">사업자등록번호</label>
                <input value={editingClient.bizNo || ''} onChange={e=>setEditingClient({...editingClient, bizNo:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 block">주소</label>
                <input value={editingClient.address} onChange={e=>setEditingClient({...editingClient, address:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
              </div>
              
              <div className="sm:col-span-2 md:col-span-3">
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block">담당자 1</label>
                      <input value={editingClient.manager1 || ''} onChange={e=>setEditingClient({...editingClient, manager1:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="이름" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block">연락처 1</label>
                      <input value={editingClient.phone1 || ''} onChange={e=>setEditingClient({...editingClient, phone1:formatPhoneStr(e.target.value)})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="연락처" />
                    </div>
                 </div>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block">담당자 2</label>
                      <input value={editingClient.manager2 || ''} onChange={e=>setEditingClient({...editingClient, manager2:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="이름" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block">연락처 2</label>
                      <input value={editingClient.phone2 || ''} onChange={e=>setEditingClient({...editingClient, phone2:formatPhoneStr(e.target.value)})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="연락처" />
                    </div>
                 </div>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-xs font-bold text-gray-500 block">특이사항</label>
                <input value={editingClient.notes || ''} onChange={e=>setEditingClient({...editingClient, notes:e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
              </div>

              <div className="sm:col-span-2 md:col-span-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-xs font-bold text-blue-700 block">접속 ID</label>
                  <input value={editingClient.loginId} onChange={e=>setEditingClient({...editingClient, loginId:e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg font-bold outline-none bg-white"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-700 block">비밀번호</label>
                  <input value={editingClient.password} onChange={e=>setEditingClient({...editingClient, password:e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg font-bold outline-none bg-white"/>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100">
              <button onClick={()=>setEditingClient(null)} className="px-5 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-700">취소</button>
              <button onClick={handleSaveEditClient} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-sm">수정 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 배차 수정 모달 (전체 내용 소환) */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-8 max-w-4xl w-full my-auto border-t-4 border-blue-600">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Edit className="text-blue-600"/> 운송 오더 수정 <span className="text-sm font-normal text-gray-500 ml-2">ORDER #{editingOrder.id}</span>
            </h2>

            <div className="mb-4 md:mb-6 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">요청 고객사/운수사 연결</label>
              <select value={editingOrder.clientId} onChange={e=>setEditingOrder({...editingOrder, clientId: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none font-bold text-[16px] md:text-sm bg-white focus:border-blue-600">
                <option value="">고객사 미지정 (직접 입력 건)</option>
                {clients.map(c => <option key={c.id} value={c.id}>[{c.type || '화주'}] {c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 w-full">
              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-blue-600 mb-1.5 block">상차지</label>
                <input value={editingOrder.loadingLoc} onChange={e=>setEditingOrder({...editingOrder, loadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="주소 입력" />
              </div>
              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차 일시</label>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-blue-600 w-full">
                     <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                     <input type="text" maxLength="2" value={editingOrder.loadingMonth} onChange={e=>setEditingOrder({...editingOrder, loadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="월" />
                     <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                     <input type="text" maxLength="2" value={editingOrder.loadingDay} onChange={e=>setEditingOrder({...editingOrder, loadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="일" />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select value={editingOrder.loadingHour} onChange={e=>setEditingOrder({...editingOrder, loadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                      {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                    </select>
                    <select value={editingOrder.loadingMin} onChange={e=>setEditingOrder({...editingOrder, loadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                      {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-red-600 mb-1.5 block">하차지</label>
                <input value={editingOrder.unloadingLoc} onChange={e=>setEditingOrder({...editingOrder, unloadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-[16px] md:text-sm" placeholder="주소 입력" />
              </div>
              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차 일시</label>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-blue-600 w-full">
                     <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                     <input type="text" maxLength="2" value={editingOrder.unloadingMonth} onChange={e=>setEditingOrder({...editingOrder, unloadingMonth: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="월" />
                     <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                     <input type="text" maxLength="2" value={editingOrder.unloadingDay} onChange={e=>setEditingOrder({...editingOrder, unloadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 py-3" placeholder="일" />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select value={editingOrder.unloadingHour} onChange={e=>setEditingOrder({...editingOrder, unloadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                      {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                    </select>
                    <select value={editingOrder.unloadingMin} onChange={e=>setEditingOrder({...editingOrder, unloadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-blue-600">
                      {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6 w-full">
              <div className="col-span-1 min-w-0">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">장비</label>
                <input value={editingOrder.equipment} onChange={e=>setEditingOrder({...editingOrder, equipment: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600" placeholder="예: L/B" />
              </div>
              <div className="col-span-1 min-w-0">
                <label className="text-xs font-bold text-red-600 mb-1.5 block">제품명(호선)</label>
                <input value={editingOrder.productName} onChange={e=>setEditingOrder({...editingOrder, productName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600" placeholder="예: A/R 50MC" />
              </div>
              <div className="col-span-2 lg:col-span-1 min-w-0">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지 담당자 <span className="text-gray-400 font-normal">(연락처)</span></label>
                <input value={editingOrder.loadingManager} onChange={e=>setEditingOrder({...editingOrder, loadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600" placeholder="예: 홍길동 010-1234-5678" />
              </div>
              <div className="col-span-2 lg:col-span-1 min-w-0">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지 담당자 <span className="text-gray-400 font-normal">(연락처)</span></label>
                <input value={editingOrder.unloadingManager} onChange={e=>setEditingOrder({...editingOrder, unloadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600" placeholder="예: 이하차 주임 010-0000-0000" />
              </div>
            </div>

            <div className="mb-4 md:mb-6 w-full">
              <label className="text-xs font-bold text-blue-600 mb-1.5 block">제원 <span className="text-gray-400 font-normal">(mm)</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-blue-600">
                  <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">길이</span>
                  <input value={editingOrder.productLength} onChange={e=>setEditingOrder({...editingOrder, productLength: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-blue-600">
                  <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">폭</span>
                  <input value={editingOrder.productWidth} onChange={e=>setEditingOrder({...editingOrder, productWidth: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden w-full focus-within:ring-1 focus-within:ring-blue-600">
                  <span className="px-3 py-3 bg-gray-100 text-blue-600 text-[14px] font-bold border-r border-gray-200">높이</span>
                  <input value={editingOrder.productHeight} onChange={e=>setEditingOrder({...editingOrder, productHeight: e.target.value})} className="w-full p-3 bg-transparent outline-none" />
                </div>
              </div>
            </div>

            <div className="mb-4 md:mb-6 w-full">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">주의사항</label>
              <input value={editingOrder.notes} onChange={e=>setEditingOrder({...editingOrder, notes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-600" placeholder="특이사항 입력" />
            </div>

            {/* 수정 모달 내 기사 배정 및 용차 정보 */}
            <div className="mb-4 md:mb-6 w-full">
               <label className="text-xs font-bold text-gray-500 mb-1.5 block">기사 배정 변경</label>
               <select value={editingOrder.driverId} onChange={e=>setEditingOrder({...editingOrder, driverId: e.target.value})} className={`w-full p-3 border rounded-lg outline-none font-bold focus:ring-1 focus:ring-blue-600 ${editingOrder.driverId === 'yongcha' ? 'border-purple-300 bg-purple-50 text-purple-800' : 'border-gray-200 bg-gray-50'}`}>
                 <option value="">미배정 상태로 두기</option>
                 {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                 <option value="yongcha" className="font-bold text-purple-700">🚚 용차 (외부 기사) 전환</option>
               </select>

               {editingOrder.driverId === 'yongcha' && (
                 <div className="w-full mt-4 p-5 border border-purple-200 bg-purple-50 rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">용차 정보 수정</span>
                      <span className="text-xs text-purple-800 font-bold">외부 기사님의 정보를 입력해주세요.</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                      <div>
                        <label className="text-xs font-bold text-purple-800 mb-1 block">차량번호 *</label>
                        <input value={editingOrder.yongchaVehicle} onChange={e=>setEditingOrder({...editingOrder, yongchaVehicle: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 11가1111" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-purple-800 mb-1 block">기사명 *</label>
                        <input value={editingOrder.yongchaName} onChange={e=>setEditingOrder({...editingOrder, yongchaName: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 홍길동" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-purple-800 mb-1 block">연락처</label>
                        <input value={editingOrder.yongchaPhone} onChange={e=>setEditingOrder({...editingOrder, yongchaPhone: formatPhoneStr(e.target.value)})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 010-1234-5678" />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-purple-800 mb-1 block">결제방식/결제금액</label>
                        <input value={editingOrder.yongchaPayment} onChange={e=>setEditingOrder({...editingOrder, yongchaPayment: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="예: 인수증 15만" />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-2">
                        <label className="text-xs font-bold text-purple-800 mb-1 block">기타사항</label>
                        <input value={editingOrder.yongchaNotes} onChange={e=>setEditingOrder({...editingOrder, yongchaNotes: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-600 text-sm" placeholder="용차 관련 메모" />
                      </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-100">
              <button onClick={()=>setEditingOrder(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">취소</button>
              <button onClick={handleSaveEdit} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5">수정 내용 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('realtime');

  const [clients, setClients] = useState(defaultClients);
  const [drivers, setDrivers] = useState(defaultDrivers);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });

  const showAlert = (message) => setModal({ isOpen: true, type: 'alert', message, onConfirm: null });
  const showConfirm = (message, onConfirm) => setModal({ isOpen: true, type: 'confirm', message, onConfirm });
  const closeModal = () => setModal({ isOpen: false, type: 'alert', message: '', onConfirm: null });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const addOrders = (newOrders) => setOrders(prev => [...prev, ...newOrders]);
  const updateOrder = (id, updates) => setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  const deleteOrder = (id) => setOrders(prev => prev.filter(o => o.id !== id));

  const addPendingDriver = (driver) => setPendingDrivers(prev => [...prev, driver]);
  const approveDriverAction = (driver) => {
    setDrivers(prev => [...prev, driver]);
    setPendingDrivers(prev => prev.filter(d => d.id !== driver.id));
    showAlert(`[${driver.vehicleNumber}] 기사님 가입이 승인되었습니다.`);
  };
  const rejectDriverAction = (id) => {
    setPendingDrivers(prev => prev.filter(d => d.id !== id));
    showAlert('가입 신청이 반려되었습니다.');
  };
  
  // --- 기사 등록, 수정, 삭제 함수 ---
  const addDriver = (newDriver) => setDrivers(prev => [...prev, newDriver]);
  const updateDriver = (id, updates) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDriver = (id) => setDrivers(prev => prev.filter(d => d.id !== id));

  const syncFromFirebase = () => {
    // Firebase 연동 로직
  };

  return (
    <>
      {!userType && (
        <LoginScreen 
          clients={clients} drivers={drivers} pendingDrivers={pendingDrivers} 
          setCurrentUser={setCurrentUser} setUserType={setUserType} setActiveTab={setActiveTab} 
          showAlert={showAlert} addPendingDriver={addPendingDriver} 
        />
      )}
      {userType === 'client' && (
        <ClientApp 
          orders={orders} currentUser={currentUser} setCurrentUser={setCurrentUser} 
          setUserType={setUserType} showAlert={showAlert} showConfirm={showConfirm} 
          handleRefresh={handleRefresh} isRefreshing={isRefreshing} addOrders={addOrders} 
          adminsList={adminsList}
        />
      )}
      {userType === 'driver' && (
        <DriverApp 
          orders={orders} drivers={drivers} currentUser={currentUser} setCurrentUser={setCurrentUser} 
          setUserType={setUserType} setActiveTab={setActiveTab} showAlert={showAlert} 
          showConfirm={showConfirm} handleRefresh={handleRefresh} isRefreshing={isRefreshing}
          updateOrder={updateOrder} updateDriver={updateDriver}
        />
      )}
      {userType === 'admin' && (
        <AdminDashboard 
          clients={clients} setClients={setClients}
          orders={orders} drivers={drivers} pendingDrivers={pendingDrivers} 
          currentUser={currentUser} setCurrentUser={setCurrentUser} setUserType={setUserType} 
          activeTab={activeTab} setActiveTab={setActiveTab} showAlert={showAlert} 
          showConfirm={showConfirm} handleRefresh={handleRefresh} isRefreshing={isRefreshing}
          addOrders={addOrders} updateOrder={updateOrder} deleteOrder={deleteOrder}
          approveDriverAction={approveDriverAction} rejectDriverAction={rejectDriverAction}
          syncFromFirebase={syncFromFirebase}
          addDriver={addDriver} updateDriver={updateDriver} deleteDriver={deleteDriver}
        />
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all mx-2">
            <p className="text-gray-800 text-[15px] md:text-base font-bold mb-6 md:mb-8 whitespace-pre-wrap leading-relaxed text-center mt-2 md:mt-4 break-keep">{modal.message}</p>
            <div className="flex gap-2 justify-end w-full">
              {modal.type === 'confirm' && (
                <button onClick={closeModal} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">취소</button>
              )}
              <button onClick={() => { if (modal.onConfirm) modal.onConfirm(); closeModal(); }} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors">확인</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;