import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Clock, Package, CheckCircle, User, LogOut, Plus, Trash2, List, Shield, AlertTriangle, ArrowRight, RotateCcw, Download, ChevronRight, UserPlus, Check, X, ArrowLeft, Calendar, Filter, Menu, Edit, RefreshCw, ArrowRightLeft, Bell, Smartphone, DownloadCloud } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
  authDomain: "hwt-app-fcd56.firebaseapp.com",
  projectId: "hwt-app-fcd56",
  storageBucket: "hwt-app-fcd56.firebasestorage.app",
  messagingSenderId: "697712630635",
  appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  // --- Firebase에서 실시간으로 받아올 데이터 (초기값 빈 배열) ---
  const [drivers, setDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [orders, setOrders] = useState([]);

  // --- 로그인/사용자 상태 ---
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dispatch');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- 공통 모달(팝업) 상태 ---
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const showAlert = (message) => setModal({ isOpen: true, type: 'alert', message, onConfirm: null });
  const showConfirm = (message, onConfirm) => setModal({ isOpen: true, type: 'confirm', message, onConfirm });
  const closeModal = () => setModal({ isOpen: false, type: 'alert', message: '', onConfirm: null });

  // --- Firebase 실시간 리스너 (앱 시작 시 한 번만 실행) ---
  useEffect(() => {
    const unsubscribeDrivers = onValue(ref(db, 'drivers'), (snapshot) => {
      const data = snapshot.val();
      setDrivers(data ? Object.values(data) : []);
    });
    const unsubscribePending = onValue(ref(db, 'pendingDrivers'), (snapshot) => {
      const data = snapshot.val();
      setPendingDrivers(data ? Object.values(data) : []);
    });
    const unsubscribeOrders = onValue(ref(db, 'orders'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).sort((a, b) => b.id - a.id);
        setOrders(list);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubscribeDrivers();
      unsubscribePending();
      unsubscribeOrders();
    };
  }, []);

  // --- 모달 엔터키 처리 ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modal.isOpen && e.key === 'Enter') {
        e.preventDefault();
        if (modal.onConfirm) modal.onConfirm();
        closeModal();
      }
    };
    if (modal.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  // --- 새로고침 시뮬레이션 ---
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // --- 날짜 포맷 함수 ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  // --- 로고 컴포넌트 ---
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

  // --- 군대 계급장 컴포넌트 ---
  const RankThreeStars = () => (
    <div className="flex items-center gap-[2px] mr-1.5 bg-[#1e293b] border border-[#0f172a] px-1.5 py-1 rounded-md shadow-md relative overflow-hidden shrink-0" title="3스타 (중장)">
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
      {[1,2,3].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] relative z-10 md:w-3.5 md:h-3.5">
          <defs>
            <linearGradient id={`gold-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
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
          <defs>
            <linearGradient id={`silver-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="40%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <polygon points="12 2 20 12 12 22 4 12" fill={`url(#silver-grad-${i})`} stroke="#0F172A" strokeWidth="0.5"/>
        </svg>
      ))}
    </div>
  );

  // ==================== 로그인 화면 ====================
  const LoginScreen = () => {
    const [tab, setTab] = useState('driver');
    const [driverVehicle, setDriverVehicle] = useState('');
    const [driverPw, setDriverPw] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
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
        setDriverVehicle(savedVehicle);
        setDriverPw(savedPw);
        setRememberMe(true);
      }
    }, []);

    const handleDriverLogin = () => {
      if (!driverVehicle || !driverPw) {
        return showAlert('차량번호와 비밀번호를 모두 입력해주세요.');
      }
      const approvedDriver = drivers.find(d => d.vehicleNumber === driverVehicle);
      if (approvedDriver) {
        if (approvedDriver.password === driverPw) {
          if (rememberMe) {
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
      if (isPending) {
        return showAlert('아직 승인 대기 중입니다.\n관리자의 가입 승인 후 접속이 가능합니다.');
      }
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
      const newDriver = { id: newId, vehicleNumber: regVehicle, password: regPw, name: regName, phone: regPhone };
      set(ref(db, 'pendingDrivers/' + newId), newDriver)
        .then(() => {
          showAlert(`[가입 신청 완료]\n관리자 승인 후 접속 가능합니다.`);
          setRegVehicle(''); setRegPw(''); setRegName(''); setRegPhone('');
          setIsRegistering(false);
        })
        .catch((error) => showAlert('서버 연결 에러: ' + error.message));
    };

    const handleAdminLogin = () => {
      if (adminId === '1' && adminPw === '1') {
        setUserType('admin');
        setCurrentUser({ role: 'admin', id: 'admin1', name: '이상현 부장' });
        setActiveTab('dispatch');
      } else if (adminId === '2' && adminPw === '2') {
        setUserType('admin');
        setCurrentUser({ role: 'admin', id: 'admin2', name: '이국희 과장' });
        setActiveTab('dispatch');
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
            <button className={`flex-1 py-3.5 md:py-4 font-bold text-sm transition-all active:bg-gray-100 ${tab === 'driver' && !isRegistering ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => {setTab('driver'); setIsRegistering(false);}}>기사님 접속</button>
            <button className={`flex-1 py-3.5 md:py-4 font-bold text-sm transition-all active:bg-gray-100 ${tab === 'admin' && !isRegistering ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => {setTab('admin'); setIsRegistering(false);}}>관리자 접속</button>
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
                  <input type="text" placeholder="예: 010-1234-5678" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-[16px] transition-colors" />
                </div>
                <button onClick={handleRegisterSubmit} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-95 transition-all mt-4 select-none">가입 신청하기</button>
                <div className="text-center mt-2">
                  <button onClick={() => setIsRegistering(false)} className="text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 underline p-2">로그인 화면으로 돌아가기</button>
                </div>
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
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 cursor-pointer" />
                  <label htmlFor="rememberMe" className="text-sm font-bold text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors">아이디/비밀번호 저장</label>
                </div>
                <button onClick={handleDriverLogin} className="w-full bg-gray-900 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-[0.98] transition-all select-none">로그인</button>
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
                <button onClick={handleAdminLogin} className="w-full bg-gray-900 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-gray-800 active:scale-[0.98] transition-all mt-4 select-none">로그인</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== 기사 앱 ====================
  const DriverApp = () => {
    const [driverActiveTab, setDriverActiveTab] = useState('transit');
    const [pushVisible, setPushVisible] = useState(false);
    const [pushMessage, setPushMessage] = useState('');

    const getLocalDateString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const [driverHistoryStart, setDriverHistoryStart] = useState(() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return getLocalDateString(d);
    });
    const [driverHistoryEnd, setDriverHistoryEnd] = useState(() => getLocalDateString(new Date()));

    const handleDriverDateChange = (type, value) => {
      const newStart = type === 'start' ? value : driverHistoryStart;
      const newEnd = type === 'end' ? value : driverHistoryEnd;
      const sDate = new Date(newStart);
      const eDate = new Date(newEnd);
      if ((eDate - sDate) / (1000 * 60 * 60 * 24) > 31) {
        showAlert('운송 완료 내역 조회는 최대 1달(31일)까지만 가능합니다.');
        if (type === 'start') {
          const maxEnd = new Date(sDate);
          maxEnd.setDate(maxEnd.getDate() + 31);
          setDriverHistoryStart(value);
          setDriverHistoryEnd(getLocalDateString(maxEnd));
        } else {
          const minStart = new Date(eDate);
          minStart.setDate(minStart.getDate() - 31);
          setDriverHistoryEnd(value);
          setDriverHistoryStart(getLocalDateString(minStart));
        }
        return;
      }
      if (type === 'start') setDriverHistoryStart(value);
      else setDriverHistoryEnd(value);
    };

    const currentYearStr = String(new Date().getFullYear());
    const transitOrders = orders.filter(o => o.driverId === currentUser.id && o.status !== 'completed').sort((a,b) => b.id - a.id);
    const completedOrders = orders.filter(o => {
      if (o.driverId !== currentUser.id || o.status !== 'completed') return false;
      const orderDate = o.loadingTime ? o.loadingTime.split(' ')[0] : '';
      if (!orderDate.startsWith(currentYearStr)) return false;
      if (driverHistoryStart && orderDate < driverHistoryStart) return false;
      if (driverHistoryEnd && orderDate > driverHistoryEnd) return false;
      return true;
    }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

    const displayOrders = driverActiveTab === 'transit' ? transitOrders : completedOrders;

    const [editMode, setEditMode] = useState(false);
    const [tempInfo, setTempInfo] = useState({ ...currentUser });
    const [showPwModal, setShowPwModal] = useState(false);
    const [pwChange, setPwChange] = useState({ old: '', new: '', confirm: '' });

    useEffect(() => {
      if (driverActiveTab === 'profile') {
        setTempInfo({ ...currentUser });
        setEditMode(false);
        setShowPwModal(false);
        setPwChange({ old: '', new: '', confirm: '' });
      }
    }, [driverActiveTab, currentUser]);

    // 푸시 알림 관련 코드는 FCM 도입 시 다시 구현 (현재는 주석 처리)
    // useEffect(() => {
    //   const requestNotificationPermission = async () => { ... };
    //   requestNotificationPermission();
    // }, []);

    const handleNextStatus = (orderId, currentStatus) => {
      if (currentStatus === 'assigned') {
        showConfirm('상차완료 하시겠습니까?', () => {
          update(ref(db, 'orders/' + orderId), {
            status: 'loaded',
            loadedAt: new Date().toISOString()
          });
        });
      } else if (currentStatus === 'loaded') {
        showConfirm('하차완료 하시겠습니까?', () => {
          update(ref(db, 'orders/' + orderId), {
            status: 'completed',
            completedAt: new Date().toISOString()
          });
        });
      }
    };

    const handleSaveInfo = () => {
      if (!tempInfo.name || !tempInfo.phone) return showAlert('성함과 연락처는 필수입니다.');
      update(ref(db, 'drivers/' + currentUser.id), tempInfo)
        .then(() => {
          setCurrentUser(tempInfo);
          setEditMode(false);
          showAlert('내 정보가 성공적으로 수정되었습니다.');
        })
        .catch((error) => showAlert('저장 실패: ' + error.message));
    };

    const handlePasswordSubmit = () => {
      if (pwChange.old !== currentUser.password) return showAlert('현재 비밀번호가 일치하지 않습니다.');
      if (pwChange.new !== pwChange.confirm) return showAlert('새 비밀번호 확인이 일치하지 않습니다.');
      if (pwChange.new === currentUser.password) return showAlert('현재 사용 중인 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.');
      if (pwChange.new.length < 1) return showAlert('새로운 비밀번호를 입력해주세요.');

      const updatedDriver = { ...currentUser, password: pwChange.new };
      update(ref(db, 'drivers/' + currentUser.id), updatedDriver)
        .then(() => {
          setCurrentUser(updatedDriver);
          setShowPwModal(false);
          setPwChange({ old: '', new: '', confirm: '' });
          showAlert('비밀번호가 성공적으로 변경되었습니다.');
        })
        .catch((error) => showAlert('비밀번호 변경 실패: ' + error.message));
    };

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 p-3 md:p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm w-full shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <LogoSVG className="h-6 md:h-8 w-auto shrink-0" />
            <span className="font-black text-gray-900 text-sm md:text-lg tracking-tight mr-1 shrink-0">현우종합운수</span>
            <button 
              onClick={() => setDriverActiveTab('profile')} 
              className={`text-[10px] md:text-xs font-bold transition-all px-2 md:px-2.5 py-1.5 rounded-lg border shadow-sm active:scale-95 shrink-0 whitespace-nowrap ${driverActiveTab === 'profile' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              내정보수정
            </button>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <span className="hidden sm:inline-block text-xs md:text-sm font-bold text-gray-700 mr-1 md:mr-2 truncate max-w-[100px]">{currentUser.vehicleNumber}</span>
            <button onClick={handleRefresh} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 active:text-blue-800 px-2 py-1.5 transition-colors rounded-lg active:bg-blue-50 shrink-0">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''}/>
              <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">새로고침</span>
            </button>
            <button onClick={() => { setUserType(null); setCurrentUser(null); setActiveTab('dispatch'); }} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 active:bg-gray-100 px-2 py-1.5 transition-colors rounded-lg shrink-0">
              <LogOut size={14}/>
              <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">로그아웃</span>
            </button>
          </div>
        </header>

        {/* 푸시 알림 UI (추후 활성화) */}
        <div className={`fixed top-4 left-0 right-0 z-[100] px-4 transition-all duration-500 pointer-events-none flex justify-center ${pushVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 w-full max-w-sm pointer-events-auto flex gap-3 items-start">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-sm shrink-0">
              <Bell className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[11px] font-black text-blue-600 mb-0.5 tracking-wider">현우종합운수 알림</p>
              <p className="text-sm font-bold text-gray-900 leading-snug break-keep">{pushMessage}</p>
              <p className="text-[10px] font-medium text-gray-400 mt-1">방금 전</p>
            </div>
            <button onClick={() => setPushVisible(false)} className="text-gray-400 p-1 hover:text-gray-600"><X size={16}/></button>
          </div>
        </div>

        <main className="flex-1 p-3 md:p-4 space-y-4 overflow-y-auto pb-28 md:pb-32 scroll-smooth w-full">
          {driverActiveTab === 'transit' || driverActiveTab === 'completed' ? (
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <h2 className="text-base md:text-lg font-bold text-gray-900 px-1">
                {driverActiveTab === 'transit' ? `배차 내역 (${transitOrders.length})` : `${parseInt(driverHistoryEnd.split('-')[1], 10)}월 운송 완료 내역 (${completedOrders.length})`}
              </h2>

              {driverActiveTab === 'completed' && (
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm mb-2 w-full">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[11px] md:text-xs font-bold text-gray-500">조회 기간 설정 <span className="text-gray-400 font-normal">(최대 1달)</span></span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input 
                      type="date" 
                      value={driverHistoryStart} 
                      onChange={(e) => handleDriverDateChange('start', e.target.value)} 
                      className="w-full sm:flex-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm font-bold text-gray-700 outline-none focus:ring-1 focus:ring-gray-900" 
                    />
                    <span className="hidden sm:inline text-gray-400 font-bold">~</span>
                    <input 
                      type="date" 
                      value={driverHistoryEnd} 
                      onChange={(e) => handleDriverDateChange('end', e.target.value)} 
                      className="w-full sm:flex-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm font-bold text-gray-700 outline-none focus:ring-1 focus:ring-gray-900" 
                    />
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
                      <span className="text-[11px] md:text-xs font-bold text-gray-400 tracking-wider shrink-0">ORDER #{order.id}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {order.status === 'assigned' && <span className="px-2.5 md:px-3 py-1 bg-white border border-gray-300 text-gray-800 rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">배차</span>}
                        {order.status === 'loaded' && <span className="px-2.5 md:px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">상차완료</span>}
                        {order.status === 'completed' && <span className="px-2.5 md:px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap">운송완료</span>}
                      </div>
                    </div>

                    <div className="p-3.5 md:p-5 space-y-4 md:space-y-5">
                      <div className="relative pl-5 md:pl-6 border-l-2 border-gray-200 space-y-5 md:space-y-6 ml-1 md:ml-2">
                        <div className="relative">
                          <div className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full -left-[27px] md:-left-[31px] top-1"></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="min-w-0 pr-2">
                              <p className="text-[12px] md:text-[13px] font-bold text-gray-500 mb-1.5 flex flex-wrap items-center gap-1.5">
                                상차예정 <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[13px] md:text-[14px] shadow-sm border border-blue-100 shrink-0">{formatDate(order.loadingTime)}</span>
                              </p>
                              <p className="text-base md:text-lg font-bold text-gray-900 leading-tight break-keep">{order.loadingLoc}</p>
                            </div>
                            {order.loadedAt && (
                              <div className="text-left sm:text-right bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm self-start shrink-0">
                                <p className="text-[9px] md:text-[10px] font-bold text-blue-500 tracking-wide">실제 상차시간</p>
                                <p className="text-xs md:text-sm font-bold text-blue-700">{formatDate(order.loadedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute w-3 h-3 bg-gray-800 rounded-full -left-[27px] md:-left-[31px] top-1"></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="min-w-0 pr-2">
                              <p className="text-[12px] md:text-[13px] font-bold text-gray-500 mb-1.5 flex flex-wrap items-center gap-1.5">
                                하차예정 <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-[13px] md:text-[14px] shadow-sm border border-orange-100 shrink-0">{formatDate(order.unloadingTime)}</span>
                              </p>
                              <p className="text-base md:text-lg font-bold text-gray-900 leading-tight break-keep">{order.unloadingLoc}</p>
                            </div>
                            {order.completedAt && (
                              <div className="text-left sm:text-right bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm self-start shrink-0">
                                <p className="text-[9px] md:text-[10px] font-bold text-gray-500 tracking-wide">실제 하차시간</p>
                                <p className="text-xs md:text-sm font-bold text-gray-700">{formatDate(order.completedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 md:p-4 rounded-xl space-y-2.5 border border-gray-100 shadow-sm w-full">
                         {order.equipment && (
                           <div className="flex justify-between items-center gap-2">
                             <span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">장비</span> 
                             <span className="text-xs md:text-sm font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded border border-blue-100 truncate text-right">{order.equipment}</span>
                           </div>
                         )}
                         <div className="flex justify-between items-center gap-2">
                           <span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">제품명(호선)</span> 
                           <span className="text-xs md:text-sm font-bold text-gray-800 truncate text-right">{order.productName}</span>
                         </div>
                         {(order.productLength || order.productWidth || order.productHeight) && (
                           <div className="flex justify-between items-center gap-2">
                             <span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">제원 (L/W/H)</span> 
                             <span className="text-[11px] md:text-xs font-bold text-gray-800 text-right truncate">{[order.productLength, order.productWidth, order.productHeight].map(s => s ? s+'mm' : '-').join(' / ')}</span>
                           </div>
                         )}
                         
                         {(order.loadingManager || order.unloadingManager) && (
                           <div className="pt-2.5 mt-1 border-t border-gray-200/80 space-y-2.5">
                             {order.loadingManager && (
                               <div className="flex justify-between items-center gap-2">
                                 <span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">상차지 담당자</span> 
                                 <span className="text-xs md:text-sm font-bold text-gray-700 truncate text-right">{order.loadingManager}</span>
                               </div>
                             )}
                             {order.unloadingManager && (
                               <div className="flex justify-between items-center gap-2">
                                 <span className="text-[11px] md:text-xs font-bold text-gray-500 shrink-0">하차지 담당자</span> 
                                 <span className="text-xs md:text-sm font-bold text-gray-700 truncate text-right">{order.unloadingManager}</span>
                               </div>
                             )}
                           </div>
                         )}

                         {order.notes && (
                           <div className="flex justify-between items-start pt-2.5 mt-1 border-t border-gray-200/80 gap-2">
                             <span className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5 shrink-0">주의사항</span> 
                             <span className="text-xs md:text-sm font-bold text-red-500 text-right break-keep">{order.notes}</span>
                           </div>
                         )}
                      </div>

                      {order.status === 'assigned' && <button onClick={() => handleNextStatus(order.id, order.status)} className="w-full py-3.5 md:py-4 bg-gray-900 text-white rounded-xl font-bold text-base md:text-lg shadow-sm hover:bg-gray-800 active:bg-gray-700 active:scale-[0.98] transition-all select-none">상차완료 보고하기</button>}
                      {order.status === 'loaded' && <button onClick={() => handleNextStatus(order.id, order.status)} className="w-full py-3.5 md:py-4 bg-blue-600 text-white rounded-xl font-bold text-base md:text-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all select-none">하차완료 보고하기</button>}
                    </div>
                  </div>
                ))
              )}
              <div className="h-10 w-full opacity-0 pointer-events-none"></div>
            </div>
          ) : (
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-200 shadow-sm relative overflow-hidden w-full">
                <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 pointer-events-none"><User size={80}/></div>
                <div className="flex items-end justify-between mb-8 relative z-10">
                   <div className="min-w-0 pr-2">
                     <h2 className="text-xl md:text-2xl font-black text-gray-900 truncate">{currentUser.vehicleNumber}</h2>
                     <p className="text-xs md:text-sm text-gray-500 font-medium truncate">{currentUser.name} 기사님</p>
                   </div>
                   {!editMode && <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold shadow-md active:scale-90 transition-transform shrink-0"><Edit size={14}/> 정보 수정</button>}
                </div>

                <div className="space-y-5 md:space-y-6 relative z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0"><User size={18}/></div>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400">연락처 *</p>
                      {editMode ? <input value={tempInfo.phone} onChange={e=>setTempInfo({...tempInfo, phone: e.target.value})} className="w-full border-b-2 border-blue-500 py-1 font-bold text-gray-900 outline-none text-[16px] md:text-sm bg-transparent" /> : <p className="font-bold text-gray-900 truncate text-sm md:text-base">{currentUser.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0"><Truck size={18}/></div>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400">샷시 종류</p>
                      {editMode ? <input value={tempInfo.chassisType} placeholder="예: 가변형 평판" onChange={e=>setTempInfo({...tempInfo, chassisType: e.target.value})} className="w-full border-b-2 border-blue-500 py-1 font-bold text-gray-900 outline-none text-[16px] md:text-sm bg-transparent" /> : <p className="font-bold text-gray-900 truncate text-sm md:text-base">{currentUser.chassisType || '미등록'}</p>}
                    </div>
                  </div>

                  {editMode && (
                    <div className="mt-6 md:mt-8 pt-6 border-t border-gray-100">
                      <button onClick={() => setShowPwModal(true)} className="w-full flex items-center justify-between p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                         <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                           <Shield size={18} className="text-blue-600 shrink-0"/>
                           비밀번호 변경
                         </div>
                         <ChevronRight size={18} className="text-gray-400 shrink-0"/>
                      </button>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-2 mt-6 md:mt-8 pt-6 border-t border-gray-100 relative z-10">
                    <button onClick={() => { setEditMode(false); setTempInfo({...currentUser}); }} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm md:text-base shadow-sm">취소</button>
                    <button onClick={handleSaveInfo} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm md:text-base shadow-md active:scale-95 transition-transform">저장하기</button>
                  </div>
                )}
              </div>
              {!editMode && <p className="text-center text-[11px] text-gray-400 font-medium mx-2">개인정보는 상단 '정보 수정' 버튼을 눌러 변경 가능합니다.</p>}
              <div className="h-10 w-full opacity-0 pointer-events-none"></div>
            </div>
          )}
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

        {showPwModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-5 md:p-6 w-full max-w-sm shadow-2xl text-left">
              <h3 className="text-base md:text-lg font-black text-gray-900 mb-5 md:mb-6 flex items-center gap-2 border-b border-gray-100 pb-3 md:pb-4"><Shield size={20} className="text-blue-600 shrink-0"/> 시스템 비밀번호 변경</h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="text-[10px] md:text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">현재 비밀번호</label>
                  <input type="password" value={pwChange.old} onChange={e=>setPwChange({...pwChange, old: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold text-gray-800" placeholder="기존 비밀번호 입력" />
                </div>
                <div>
                  <label className="text-[10px] md:text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">새 비밀번호</label>
                  <input type="password" value={pwChange.new} onChange={e=>setPwChange({...pwChange, new: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-600" placeholder="새 비밀번호" />
                </div>
                <div>
                  <label className="text-[10px] md:text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">새 비밀번호 확인</label>
                  <input type="password" value={pwChange.confirm} onChange={e=>setPwChange({...pwChange, confirm: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-600" placeholder="다시 한번 입력" />
                </div>
              </div>
              <div className="flex gap-2 mt-6 md:mt-8">
                <button onClick={() => {setShowPwModal(false); setPwChange({ old: '', new: '', confirm: '' });}} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm md:text-base active:scale-95 transition-all">취소</button>
                <button onClick={handlePasswordSubmit} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm md:text-base shadow-md active:scale-95 transition-all">변경하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== 관리자 대시보드 ====================
  const AdminDashboard = () => {
    // --- 관리자 전용 상태 (필터, 입력값 등) ---
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');

    const [newOrder, setNewOrder] = useState({
      loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
      unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
      equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
      loadingManager: '', unloadingManager: '', notes: '', driverId: ''
    });

    const [editingOrder, setEditingOrder] = useState(null);

    // refs
    const newLoadDayRef = useRef();
    const newUnloadDayRef = useRef();
    const editLoadDayRef = useRef();
    const editUnloadDayRef = useRef();

    // 필터 상태
    const [historyStart, setHistoryStart] = useState(() => {
      const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
    });
    const [historyEnd, setHistoryEnd] = useState(() => new Date().toISOString().split('T')[0]);
    const [historyDriver, setHistoryDriver] = useState('all');

    const [filterStart, setFilterStart] = useState(() => {
      const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
    });
    const [filterEnd, setFilterEnd] = useState(() => new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState('all');

    const [statusStart, setStatusStart] = useState(() => {
      const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
    });
    const [statusEnd, setStatusEnd] = useState(() => new Date().toISOString().split('T')[0]);
    const [statusDriver, setStatusDriver] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedDriver, setSelectedDriver] = useState(null);

    const incompleteOrders = orders.filter(o => o.status !== 'completed').sort((a, b) => b.id - a.id);

    // --- Firebase 쓰기 함수들 ---
    const handleAddOrder = () => {
      if (!newOrder.loadingLoc || !newOrder.unloadingLoc || !newOrder.loadingMonth || !newOrder.loadingDay || !newOrder.unloadingMonth || !newOrder.unloadingDay || !newOrder.productName || !newOrder.equipment) {
        return showAlert('필수 항목(상/하차지, 상/하차 일시, 장비, 제품명(호선))을 모두 입력해주세요.');
      }
      showConfirm('입력하신 내용으로 배차를 전송(등록)하시겠습니까?', () => {
        const formattedLoadingDate = `${year}-${String(newOrder.loadingMonth).padStart(2, '0')}-${String(newOrder.loadingDay).padStart(2, '0')}`;
        const formattedUnloadingDate = `${year}-${String(newOrder.unloadingMonth).padStart(2, '0')}-${String(newOrder.unloadingDay).padStart(2, '0')}`;
        const formattedLoadingTime = `${formattedLoadingDate} ${newOrder.loadingHour}:${newOrder.loadingMin}`;
        const formattedUnloadingTime = `${formattedUnloadingDate} ${newOrder.unloadingHour}:${newOrder.unloadingMin}`;

        const orderId = Date.now();
        const orderData = {
          ...newOrder,
          loadingTime: formattedLoadingTime,
          unloadingTime: formattedUnloadingTime,
          id: orderId,
          driverId: newOrder.driverId ? Number(newOrder.driverId) : null,
          status: 'assigned',
          loadedAt: null,
          completedAt: null,
          assignedBy: currentUser.name
        };

        set(ref(db, 'orders/' + orderId), orderData)
          .then(() => {
            showAlert('새로운 배차가 정상적으로 전송되었습니다.');
            setNewOrder({
              loadingLoc: '', loadingMonth: currentMonth, loadingDay: currentDay, loadingHour: '08', loadingMin: '00',
              unloadingLoc: '', unloadingMonth: currentMonth, unloadingDay: currentDay, unloadingHour: '14', unloadingMin: '00',
              equipment: '', productName: '', productLength: '', productWidth: '', productHeight: '',
              loadingManager: '', unloadingManager: '', notes: '', driverId: ''
            });
          })
          .catch((error) => showAlert('서버 전송 에러: ' + error.message));
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
        loadingMonth: lTime.m,
        loadingDay: lTime.d,
        loadingHour: lTime.h,
        loadingMin: lTime.min,
        unloadingMonth: uTime.m,
        unloadingDay: uTime.d,
        unloadingHour: uTime.h,
        unloadingMin: uTime.min,
        equipment: order.equipment || '',
        driverId: order.driverId || ''
      });
    };

    const handleSaveEdit = () => {
      if (!editingOrder.loadingLoc || !editingOrder.unloadingLoc || !editingOrder.loadingMonth || !editingOrder.loadingDay || !editingOrder.unloadingMonth || !editingOrder.unloadingDay || !editingOrder.productName || !editingOrder.equipment) {
        return showAlert('필수 항목을 모두 입력해주세요.');
      }

      const formattedLoadingDate = `${year}-${String(editingOrder.loadingMonth).padStart(2, '0')}-${String(editingOrder.loadingDay).padStart(2, '0')}`;
      const formattedUnloadingDate = `${year}-${String(editingOrder.unloadingMonth).padStart(2, '0')}-${String(editingOrder.unloadingDay).padStart(2, '0')}`;
      const formattedLoadingTime = `${formattedLoadingDate} ${editingOrder.loadingHour}:${editingOrder.loadingMin}`;
      const formattedUnloadingTime = `${formattedUnloadingDate} ${editingOrder.unloadingHour}:${editingOrder.unloadingMin}`;

      const updatedData = {
        ...editingOrder,
        loadingTime: formattedLoadingTime,
        unloadingTime: formattedUnloadingTime,
        driverId: editingOrder.driverId ? Number(editingOrder.driverId) : null
      };

      update(ref(db, 'orders/' + editingOrder.id), updatedData)
        .then(() => {
          showAlert('운송 오더 내용이 성공적으로 수정되었습니다.');
          setEditingOrder(null);
        })
        .catch((error) => showAlert('수정 실패: ' + error.message));
    };

    const handleAdminStatusChange = (orderId, newStatus) => {
      const statusNames = { assigned: '배차 (상차 전)', loaded: '상차완료 (운송 중)', completed: '하차완료(운송완료)' };
      showConfirm(
        <span>해당 배차의 상태를 <strong className="text-red-500 text-lg mx-1">'{statusNames[newStatus]}'</strong>(으)로 변경하시겠습니까?<br/><span className="text-[13px] text-gray-500 font-medium mt-1.5 inline-block">(상태에 맞게 처리시간이 자동으로 조정됩니다.)</span></span>,
        () => {
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          let newLoadedAt = order.loadedAt;
          let newCompletedAt = order.completedAt;
          if (newStatus === 'assigned') { newLoadedAt = null; newCompletedAt = null; }
          else if (newStatus === 'loaded') { newLoadedAt = newLoadedAt || new Date().toISOString(); newCompletedAt = null; }
          else if (newStatus === 'completed') { newLoadedAt = newLoadedAt || new Date().toISOString(); newCompletedAt = newCompletedAt || new Date().toISOString(); }

          update(ref(db, 'orders/' + orderId), {
            status: newStatus,
            loadedAt: newLoadedAt,
            completedAt: newCompletedAt
          }).catch((error) => showAlert('상태 변경 실패: ' + error.message));
        }
      );
    };

    const handleDeleteOrder = (orderId) => {
      showConfirm('해당 배차를 영구적으로 삭제하시겠습니까?', () => {
        remove(ref(db, 'orders/' + orderId)).catch((error) => showAlert('삭제 실패: ' + error.message));
      });
    };

    const handleAssignDriver = (orderId, newDriverId, currentDriverId) => {
      if (!newDriverId) return;
      if (newDriverId === 'unassign') {
        showConfirm('해당 배차를 \'미배정\' 상태로 변경하시겠습니까?', () => {
          update(ref(db, 'orders/' + orderId), {
            driverId: null,
            reassignedBy: currentUser.name,
            reassignedAt: new Date().toISOString()
          });
        });
        return;
      }
      const targetDriverId = Number(newDriverId);
      const targetDriver = drivers.find(d => d.id === targetDriverId);
      if (!targetDriver) return;
      showConfirm(`해당 배차를 '${targetDriver.vehicleNumber}' 기사님께 이관하시겠습니까?`, () => {
        update(ref(db, 'orders/' + orderId), {
          driverId: targetDriverId,
          reassignedBy: currentUser.name,
          reassignedAt: new Date().toISOString()
        });
      });
    };

    const approveDriver = (driver) => {
      set(ref(db, 'drivers/' + driver.id), driver)
        .then(() => {
          remove(ref(db, 'pendingDrivers/' + driver.id));
          showAlert(`${driver.name} 기사님의 가입이 승인되었습니다.`);
        })
        .catch((error) => showAlert('승인 처리 중 오류: ' + error.message));
    };

    const rejectDriver = (driverId) => {
      showConfirm('해당 가입 신청을 반려하시겠습니까?', () => {
        remove(ref(db, 'pendingDrivers/' + driverId)).catch((error) => showAlert('반려 처리 실패: ' + error.message));
      });
    };

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 h-14 md:h-16 flex items-center justify-between px-3 md:px-6 z-20 shadow-sm shrink-0 w-full overflow-hidden">
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0 min-w-0 pr-2">
            <LogoSVG className="h-6 w-auto md:h-8 shrink-0" />
            <span className="text-[15px] md:text-xl font-black text-gray-900 tracking-tight mt-0.5 md:mt-1 truncate">현우종합운수</span>
            <div className="hidden sm:block h-4 md:h-5 w-px bg-gray-300 mx-1 md:mx-2 mt-1 shrink-0"></div>
            <h1 className="hidden sm:block text-xs md:text-sm font-bold text-gray-500 tracking-wide mt-1 shrink-0">통합 관제 시스템</h1>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <div className="flex items-center text-[11px] md:text-sm font-black text-blue-700 mr-1 md:mr-2 select-none truncate max-w-[120px] md:max-w-[200px]">
              {currentUser?.id === 'admin1' && <RankThreeStars />}
              {currentUser?.id === 'admin2' && <RankCaptain />}
              <span className="truncate">{currentUser?.name}</span>
            </div>
            <button onClick={handleRefresh} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 active:text-blue-800 px-1.5 md:px-2 py-1.5 transition-colors rounded-lg active:bg-blue-50 shrink-0">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''}/>
              <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">새로고침</span>
            </button>
            <button onClick={() => { setUserType(null); setCurrentUser(null); setActiveTab('dispatch'); }} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 active:bg-gray-100 px-1.5 md:px-2 py-1.5 transition-colors rounded-lg shrink-0">
              <LogOut size={14}/>
              <span className="hidden sm:inline-block text-[11px] md:text-xs font-bold">로그아웃</span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
          <nav className="lg:hidden flex overflow-x-auto bg-white border-b border-gray-200 whitespace-nowrap scrollbar-hide shrink-0 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button onClick={()=>{setActiveTab('dispatch'); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] md:text-[15px] flex items-center gap-1.5 transition-all active:bg-gray-100 border-b-2 shrink-0 ${activeTab==='dispatch' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <Plus size={16} className="shrink-0"/> <span className="leading-snug">배차 및 선등록</span>
            </button>
            <button onClick={()=>{setActiveTab('drivers'); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] md:text-[15px] flex items-center gap-1.5 transition-all active:bg-gray-100 border-b-2 shrink-0 ${activeTab==='drivers' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <User size={16} className="shrink-0"/> <span>기사별 운송내역</span>
            </button>
            <button onClick={()=>{setActiveTab('statusChange'); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] md:text-[15px] flex items-center gap-1.5 transition-all active:bg-gray-100 border-b-2 shrink-0 ${activeTab==='statusChange' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <ArrowRightLeft size={16} className="shrink-0"/> <span>운송 상태 변경</span>
            </button>
            <button onClick={()=>{setActiveTab('history'); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] md:text-[15px] flex items-center gap-1.5 transition-all active:bg-gray-100 border-b-2 shrink-0 ${activeTab==='history' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <List size={16} className="shrink-0"/> <span>전체 운송 내역 조회</span>
            </button>
            <button onClick={()=>{setActiveTab('approvals'); setSelectedDriver(null);}} className={`px-4 py-3 text-[14px] md:text-[15px] flex items-center gap-1.5 transition-all active:bg-gray-100 border-b-2 shrink-0 ${activeTab==='approvals' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-500 font-medium'}`}>
              <UserPlus size={16} className="shrink-0"/> <span>기사 승인 관리</span>
              {pendingDrivers.length > 0 && <span className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0">{pendingDrivers.length}</span>}
            </button>
          </nav>

          <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 h-full overflow-y-auto">
            <nav className="p-4 space-y-1.5 mt-2">
              <button onClick={()=>{setActiveTab('dispatch'); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab==='dispatch' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <Plus size={18} className="shrink-0"/> <span className="leading-snug">배차 및 선등록</span>
              </button>
              <button onClick={()=>{setActiveTab('drivers'); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab==='drivers' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <User size={18} className="shrink-0"/> <span>기사별 운송내역</span>
              </button>
              <button onClick={()=>{setActiveTab('statusChange'); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab==='statusChange' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <ArrowRightLeft size={18} className="shrink-0"/> <span>운송 상태 변경</span>
              </button>
              <button onClick={()=>{setActiveTab('history'); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab==='history' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <List size={18} className="shrink-0"/> <span>전체 운송 내역 조회</span>
              </button>
              <button onClick={()=>{setActiveTab('approvals'); setSelectedDriver(null);}} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab==='approvals' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                <UserPlus size={18} className="shrink-0"/> <span className="flex-1">기사 승인 관리</span>
                {pendingDrivers.length > 0 && <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full shrink-0">{pendingDrivers.length}</span>}
              </button>
            </nav>
          </aside>

          <main className="flex-1 p-3 md:p-8 overflow-y-auto bg-gray-50 w-full scroll-smooth">
            {activeTab === 'dispatch' && (
              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 w-full">
                <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-200 shadow-sm w-full">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">신규 배차</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 w-full">
                    <div className="w-full min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지</label>
                      <input value={newOrder.loadingLoc} onChange={e=>setNewOrder({...newOrder, loadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="주소 입력" />
                    </div>
                    
                    <div className="w-full min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차 일시</label>
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                           <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                           <input type="text" maxLength="2" value={newOrder.loadingMonth} onChange={e=>{
                             const val = e.target.value.replace(/[^0-9]/g, '');
                             setNewOrder({...newOrder, loadingMonth: val});
                             if(val.length === 2 && newLoadDayRef.current) newLoadDayRef.current.focus();
                           }} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                           <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                           <input type="text" maxLength="2" ref={newLoadDayRef} value={newOrder.loadingDay} onChange={e=>setNewOrder({...newOrder, loadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <select value={newOrder.loadingHour} onChange={e=>setNewOrder({...newOrder, loadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors min-w-0">
                            {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                          </select>
                          <select value={newOrder.loadingMin} onChange={e=>setNewOrder({...newOrder, loadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors min-w-0">
                            {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="w-full min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지</label>
                      <input value={newOrder.unloadingLoc} onChange={e=>setNewOrder({...newOrder, unloadingLoc: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="주소 입력" />
                    </div>
                    
                    <div className="w-full min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차 일시</label>
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                           <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                           <input type="text" maxLength="2" value={newOrder.unloadingMonth} onChange={e=>{
                             const val = e.target.value.replace(/[^0-9]/g, '');
                             setNewOrder({...newOrder, unloadingMonth: val});
                             if(val.length === 2 && newUnloadDayRef.current) newUnloadDayRef.current.focus();
                           }} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                           <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                           <input type="text" maxLength="2" ref={newUnloadDayRef} value={newOrder.unloadingDay} onChange={e=>setNewOrder({...newOrder, unloadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <select value={newOrder.unloadingHour} onChange={e=>setNewOrder({...newOrder, unloadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors min-w-0">
                            {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                          </select>
                          <select value={newOrder.unloadingMin} onChange={e=>setNewOrder({...newOrder, unloadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors min-w-0">
                            {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6 w-full">
                    <div className="col-span-1 min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">장비</label>
                      <input value={newOrder.equipment} onChange={e=>setNewOrder({...newOrder, equipment: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: L/B" />
                    </div>
                    <div className="col-span-1 min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">제품명(호선)</label>
                      <input value={newOrder.productName} onChange={e=>setNewOrder({...newOrder, productName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 코일 20톤" />
                    </div>
                    <div className="col-span-2 lg:col-span-1 min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지 담당자 <span className="text-gray-400 font-normal">(선택)</span></label>
                      <input value={newOrder.loadingManager} onChange={e=>setNewOrder({...newOrder, loadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 김상차 대리" />
                    </div>
                    <div className="col-span-2 lg:col-span-1 min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지 담당자 <span className="text-gray-400 font-normal">(선택)</span></label>
                      <input value={newOrder.unloadingManager} onChange={e=>setNewOrder({...newOrder, unloadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 이하차 주임" />
                    </div>
                  </div>

                  <div className="mb-4 md:mb-6 w-full">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">제원 <span className="text-gray-400 font-normal">(단위: mm / 선택)</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                        <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] md:text-sm font-bold border-r border-gray-200 whitespace-nowrap shrink-0">길이</span>
                        <input value={newOrder.productLength} onChange={e=>setNewOrder({...newOrder, productLength: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="예: 12000" />
                      </div>
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                        <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] md:text-sm font-bold border-r border-gray-200 whitespace-nowrap shrink-0">폭</span>
                        <input value={newOrder.productWidth} onChange={e=>setNewOrder({...newOrder, productWidth: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="예: 2400" />
                      </div>
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                        <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] md:text-sm font-bold border-r border-gray-200 whitespace-nowrap shrink-0">높이</span>
                        <input value={newOrder.productHeight} onChange={e=>setNewOrder({...newOrder, productHeight: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] md:text-sm min-w-0" placeholder="예: 2600" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 md:mb-6 w-full">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">주의사항 <span className="text-gray-400 font-normal">(선택)</span></label>
                    <input value={newOrder.notes} onChange={e=>setNewOrder({...newOrder, notes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="특이사항 입력" />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-end mt-6 pt-6 border-t border-gray-100 w-full">
                    <div className="w-full flex-1 min-w-0">
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">기사 배정</label>
                      <select value={newOrder.driverId} onChange={e=>setNewOrder({...newOrder, driverId: e.target.value})} className="w-full p-3.5 md:p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 text-[16px] md:text-sm transition-colors cursor-pointer focus:ring-1 focus:ring-gray-900 truncate">
                        <option value="">선등록 (기사 미배정)</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                      </select>
                    </div>
                    <button onClick={handleAddOrder} className="w-full md:w-auto px-8 py-3.5 md:py-3 bg-gray-900 text-white rounded-lg font-bold shadow-sm hover:bg-gray-800 active:scale-95 transition-all text-[16px] md:text-sm select-none shrink-0">배차 전송</button>
                  </div>
                </div>

                {incompleteOrders.length > 0 && (
                  <>
                    <h2 className="text-base md:text-lg font-bold text-gray-900 pt-2 md:pt-4">실시간 현황 보드 (미완료 건)</h2>
                    <div className="grid gap-3 md:gap-4 w-full">
                      {incompleteOrders.map(order => {
                        const driver = drivers.find(d => d.id === order.driverId);
                        return (
                          <div key={order.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-900 transition-colors w-full overflow-hidden">
                            <div className="flex items-start md:items-center gap-3 md:gap-6 w-full md:w-auto min-w-0">
                              <div className="text-center w-28 md:w-36 border-r border-gray-100 pr-3 md:pr-4 shrink-0">
                                 {driver ? (
                                   <>
                                     <div className="font-black text-[15px] md:text-xl text-blue-700 whitespace-nowrap w-full">{driver.vehicleNumber}</div>
                                     <div className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5 whitespace-nowrap w-full">{driver.name} 기사님</div>
                                   </>
                                 ) : (
                                   <div className="font-black text-[12px] md:text-sm text-red-500 bg-red-50 border border-red-100 rounded-md py-1 px-2 inline-block whitespace-nowrap">미배정</div>
                                 )}
                                 <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-1.5 md:mt-2">{order.status === 'assigned' ? '배차됨' : '상차완료'}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] md:text-base font-bold text-gray-800 flex flex-wrap items-center gap-1 md:gap-2 leading-tight">
                                  <span className="break-keep">{order.loadingLoc}</span> <ArrowRight size={14} className="text-gray-400 shrink-0"/> <span className="break-keep">{order.unloadingLoc}</span>
                                </div>
                                <div className="text-[11px] md:text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                                  <span className="font-bold text-gray-700 truncate max-w-full">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</span> 
                                  {(order.productLength || order.productWidth || order.productHeight) && <span className="hidden sm:inline-block shrink-0">({order.productLength||'-'} / {order.productWidth||'-'} / {order.productHeight||'-'})</span>}
                                  {(order.loadingManager || order.unloadingManager) && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200 text-[10px] md:text-[11px] shrink-0">상:{order.loadingManager||'-'} 하:{order.unloadingManager||'-'}</span>}
                                  {order.assignedBy && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 text-[10px] md:text-[11px] font-bold shrink-0">최초 배차: {order.assignedBy}</span>}
                                  {order.reassignedBy && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-100 text-[10px] md:text-[11px] font-bold shrink-0">이관: {order.reassignedBy} ({formatDate(order.reassignedAt)})</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex w-full md:w-auto gap-2 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 justify-end shrink-0">
                               <button onClick={() => openEditModal(order)} className="text-gray-500 hover:text-blue-600 px-3 py-2 bg-gray-50 active:scale-90 md:bg-transparent rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm md:shadow-none border border-gray-200 md:border-transparent shrink-0">
                                 <Edit size={16}/> <span className="hidden sm:inline">수정</span>
                               </button>
                               <select 
                                 value=""
                                 onChange={(e) => {
                                   if(!e.target.value) return;
                                   const targetDriverId = Number(e.target.value);
                                   const targetDriver = drivers.find(d => d.id === targetDriverId);
                                   showConfirm(`해당 배차를 '${targetDriver.vehicleNumber}' 기사님께 지정/이관하시겠습니까?`, () => {
                                     // 이관 시 상태를 'assigned'로 초기화할지 여부는 기존 로직 유지
                                     update(ref(db, 'orders/' + order.id), {
                                       driverId: targetDriverId,
                                       status: 'assigned',
                                       loadedAt: null,
                                       completedAt: null,
                                       reassignedBy: currentUser.name,
                                       reassignedAt: new Date().toISOString()
                                     });
                                   });
                                 }}
                                 className="text-xs md:text-sm font-bold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-2.5 md:py-2 rounded-lg outline-none focus:border-gray-400 cursor-pointer flex-1 md:flex-none text-center transition-colors active:bg-gray-100 truncate max-w-[140px]"
                               >
                                 <option value="">기사 배정/이관</option>
                                 {drivers.filter(d => d.id !== order.driverId).map(d => <option key={d.id} value={d.id}>{d.vehicleNumber}</option>)}
                               </select>
                               <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-500 p-2.5 bg-gray-50 active:scale-90 md:bg-transparent rounded-lg transition-all shrink-0" title="삭제"><Trash2 size={18}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'history' && (() => {
              const filteredHistory = orders.filter(o => {
                if (historyDriver === 'unassigned' && o.driverId !== null) return false;
                else if (historyDriver !== 'all' && historyDriver !== 'unassigned' && o.driverId !== Number(historyDriver)) return false;
                
                if (o.loadingTime) {
                  const orderDate = o.loadingTime.split(' ')[0];
                  if (historyStart && orderDate < historyStart) return false;
                  if (historyEnd && orderDate > historyEnd) return false;
                }
                return true;
              }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

              return (
                <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
                    <h2 className="text-base md:text-lg font-bold text-gray-900">전체 운송 내역 조회</h2>
                    <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 px-4 py-2.5 md:py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all w-full sm:w-auto shrink-0">
                      <Download size={16}/> 엑셀 다운로드
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">
                    <div className="w-full lg:w-auto flex gap-3 md:gap-4 flex-col sm:flex-row">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">시작일</label>
                        <input type="date" value={historyStart} onChange={e=>setHistoryStart(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">종료일</label>
                        <input type="date" value={historyEnd} onChange={e=>setHistoryEnd(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                      </div>
                    </div>
                    <div className="w-full lg:w-auto flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">기사 선택</label>
                      <select value={historyDriver} onChange={e=>setHistoryDriver(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900 min-w-[150px] truncate">
                        <option value="all">전체 배차 보기</option>
                        <option value="unassigned">미배정 건 보기</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                      </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-2 md:ml-auto shrink-0">
                       <div className="w-full bg-gray-100 text-gray-700 px-4 py-3 md:py-2.5 rounded-lg text-[15px] md:text-sm font-bold flex items-center justify-center gap-2">
                         <Filter size={16}/> 조건 내 총 {filteredHistory.length}건
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full block" style={{ WebkitOverflowScrolling: 'touch' }}>
                     <table className="w-full text-sm text-left min-w-[800px]">
                       <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-24 md:w-28 shrink-0">상태/배차정보</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-36 shrink-0">실제 처리시간</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[180px]">운송경로</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[180px]">장비 / 제품명</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-36 text-center shrink-0">이관 / 관리</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {filteredHistory.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">해당 조건에 일치하는 운송 내역이 없습니다.</td></tr>
                         ) : (
                           filteredHistory.map(order => {
                             const driver = drivers.find(d => d.id === order.driverId);
                             return (
                               <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="p-3 md:p-4 whitespace-nowrap">
                                    <div className="mb-2">
                                      {order.status === 'assigned' && <span className="px-2 py-1 bg-white border border-gray-300 text-gray-800 rounded text-[11px] font-bold shadow-sm whitespace-nowrap">배차</span>}
                                      {order.status === 'loaded' && <span className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold shadow-sm whitespace-nowrap">상차완료</span>}
                                      {order.status === 'completed' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[11px] font-bold whitespace-nowrap">운송완료</span>}
                                    </div>
                                    <div className="mt-1">
                                      {driver ? (
                                        <>
                                          <span className="text-sm font-black text-blue-700">{driver.vehicleNumber}</span>
                                          <span className="text-xs font-bold text-gray-500 ml-1">{driver.name}</span>
                                        </>
                                      ) : (
                                        <span className="text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded text-xs font-bold">미배정</span>
                                      )}
                                    </div>
                                    {order.assignedBy && <div className="text-[10px] font-bold text-indigo-500 mt-1.5">최초 배차: {order.assignedBy}</div>}
                                    {order.reassignedBy && (
                                      <div className="text-[10px] font-bold text-orange-500 mt-1">
                                        이관: {order.reassignedBy}
                                        <div className="text-[9px] text-gray-400 font-normal mt-0.5">{formatDate(order.reassignedAt)}</div>
                                      </div>
                                    )}
                                 </td>
                                 <td className="p-3 md:p-4 text-xs whitespace-nowrap">
                                   <div className="text-gray-500 mb-1">상차: <span className="font-bold text-blue-600">{order.loadedAt ? formatDate(order.loadedAt) : '대기중'}</span></div>
                                   <div className="text-gray-500">하차: <span className="font-bold text-gray-800">{order.completedAt ? formatDate(order.completedAt) : '대기중'}</span></div>
                                 </td>
                                 <td className="p-3 md:p-4 text-gray-600 text-[13px] md:text-sm">
                                   <div className="flex items-center gap-1 flex-wrap break-keep">
                                     <span>{order.loadingLoc}</span> <ArrowRight size={12} className="text-gray-300 shrink-0"/> <span>{order.unloadingLoc}</span>
                                   </div>
                                 </td>
                                 <td className="p-3 md:p-4">
                                   <div className="text-gray-800 font-bold break-keep">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</div>
                                   {(order.productLength || order.productWidth || order.productHeight) && (
                                     <div className="text-[11px] text-gray-500 mt-0.5">제원: {[order.productLength, order.productWidth, order.productHeight].map(s=>s||'-').join('/')}</div>
                                   )}
                                 </td>
                                 <td className="p-3 md:p-4 align-middle">
                                  <div className="flex items-center gap-1">
                                    <select 
                                      value=""
                                      onChange={(e) => {
                                        if(!e.target.value) return;
                                        if(e.target.value === 'unassign') {
                                          showConfirm(`해당 배차를 '미배정' 상태로 변경하시겠습니까?`, () => {
                                            update(ref(db, 'orders/' + order.id), {
                                              driverId: null,
                                              reassignedBy: currentUser.name,
                                              reassignedAt: new Date().toISOString()
                                            });
                                          });
                                          return;
                                        }
                                        const targetDriverId = Number(e.target.value);
                                        const targetDriver = drivers.find(d => d.id === targetDriverId);
                                        showConfirm(`해당 배차를 '${targetDriver.vehicleNumber}' 기사님께 이관하시겠습니까?\n(진행/완료 상태 및 기록된 시간은 그대로 유지됩니다.)`, () => {
                                          update(ref(db, 'orders/' + order.id), {
                                            driverId: targetDriverId,
                                            reassignedBy: currentUser.name,
                                            reassignedAt: new Date().toISOString()
                                          });
                                        });
                                      }}
                                      className="w-full bg-white border border-gray-300 text-gray-600 px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-sm outline-none cursor-pointer focus:border-blue-500 text-center transition-colors hover:bg-gray-50 truncate"
                                    >
                                      <option value="">이관</option>
                                      <option value="unassign">미배정</option>
                                      {drivers.filter(d => d.id !== order.driverId).map(d => <option key={d.id} value={d.id}>{d.vehicleNumber}</option>)}
                                    </select>
                                    <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0" title="삭제"><Trash2 size={16}/></button>
                                  </div>
                                </td>
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

            {activeTab === 'approvals' && (
              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 w-full">
                <h2 className="text-base md:text-lg font-bold text-gray-900">신규 기사 가입 승인 관리</h2>
                {pendingDrivers.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-400 font-bold shadow-sm text-sm w-full">
                    현재 대기 중인 가입 신청이 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-4 w-full">
                    {pendingDrivers.map(driver => (
                      <div key={driver.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4 w-full">
                        <div className="flex gap-4 items-center min-w-0">
                           <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                             <User size={20}/>
                           </div>
                           <div className="min-w-0">
                             <div className="text-base md:text-lg font-black text-gray-900 truncate">{driver.vehicleNumber}</div>
                             <div className="text-xs md:text-sm font-medium text-gray-500 mt-1 flex flex-wrap gap-2">
                               <span className="truncate">{driver.name}</span> <span className="hidden sm:inline">|</span> <span className="truncate">{driver.phone}</span> <span className="hidden sm:inline">|</span> <span className="text-red-500 font-bold truncate">PW: {driver.password}</span>
                             </div>
                           </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto shrink-0">
                          <button onClick={() => approveDriver(driver)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-gray-900 text-white px-4 md:px-5 py-3 md:py-2.5 rounded-xl font-bold text-[15px] md:text-sm hover:bg-gray-800 active:scale-95 transition-all">
                            <Check size={16}/> 승인
                          </button>
                          <button onClick={() => rejectDriver(driver.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 px-4 md:px-5 py-3 md:py-2.5 rounded-xl font-bold text-[15px] md:text-sm hover:bg-gray-50 active:scale-95 transition-all">
                            <X size={16}/> 반려
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'drivers' && !selectedDriver && (
              <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">기사별 운송내역</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
                  {drivers.map(driver => {
                    const todayStr = `${year}-${currentMonth}-${currentDay}`;
                    const monthStr = `${year}-${currentMonth}`;

                    const driverMonthlyCompleted = orders.filter(o => o.driverId === driver.id && o.status === 'completed' && o.loadingTime && o.loadingTime.startsWith(monthStr)).length;
                    
                    const driverTodayOrders = orders.filter(o => o.driverId === driver.id && o.loadingTime && o.loadingTime.startsWith(todayStr));
                    const driverTodayAssigned = driverTodayOrders.filter(o => o.status !== 'completed').length;
                    const driverTodayCompleted = driverTodayOrders.filter(o => o.status === 'completed').length;

                    return (
                      <div key={driver.id} onClick={() => setSelectedDriver(driver)} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-gray-900 active:scale-[0.98] active:bg-gray-50 transition-all group select-none w-full min-w-0">
                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 min-w-0">
                          <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition shrink-0">
                            <User size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-base md:text-lg font-black text-blue-700 truncate">{driver.vehicleNumber}</div>
                            <div className="text-xs md:text-sm font-bold text-gray-500 mt-0.5 truncate">
                              {driver.name} <span className="mx-1 md:mx-2 font-normal">|</span> <span className="text-red-500">PW: {driver.password}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 text-[13px] md:text-sm border-t border-gray-100 pt-3 md:pt-4">
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
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'drivers' && selectedDriver && (() => {
              const filteredOrders = orders.filter(o => {
                if (o.driverId !== selectedDriver.id) return false;
                if (filterStatus !== 'all' && o.status !== filterStatus) return false;
                if (o.loadingTime) {
                  const orderDate = o.loadingTime.split(' ')[0];
                  if (filterStart && orderDate < filterStart) return false;
                  if (filterEnd && orderDate > filterEnd) return false;
                }
                return true;
              }).sort((a,b) => new Date(b.loadingTime) - new Date(a.loadingTime));

              return (
                <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                  <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6 min-w-0">
                    <button onClick={() => setSelectedDriver(null)} className="p-2 bg-white border border-gray-200 hover:bg-gray-50 active:scale-90 rounded-lg text-gray-600 transition-all shadow-sm shrink-0"><ArrowLeft size={18}/></button>
                    <div className="min-w-0">
                      <h2 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">{selectedDriver.vehicleNumber} <span className="text-[13px] md:text-base font-medium text-gray-500 shrink-0">운송 내역</span></h2>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">
                    <div className="w-full lg:w-auto flex gap-3 md:gap-4 flex-col sm:flex-row">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">시작일</label>
                        <input type="date" value={filterStart} onChange={e=>setFilterStart(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">종료일</label>
                        <input type="date" value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex-1 min-w-0">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">상태 필터</label>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-gray-900 min-w-[130px] truncate">
                        <option value="all">전체보기</option>
                        <option value="assigned">배차</option>
                        <option value="loaded">상차완료</option>
                        <option value="completed">운송완료</option>
                      </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-2 md:ml-auto shrink-0">
                       <div className="w-full bg-gray-100 text-gray-700 px-4 py-3 md:py-2.5 rounded-lg text-[15px] md:text-sm font-bold flex items-center justify-center gap-2"><Calendar size={16}/> 총 {filteredOrders.length}건</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full block" style={{ WebkitOverflowScrolling: 'touch' }}>
                     <table className="w-full text-sm text-left min-w-[700px]">
                       <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-24 md:w-28 shrink-0">상태/배차정보</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-36 shrink-0">실제 처리시간</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[180px]">운송경로</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[180px]">장비 / 제품명</th>
                           <th className="p-3 md:p-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-36 text-center shrink-0">이관 / 관리</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {filteredOrders.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">해당 조건에 일치하는 운송 내역이 없습니다.</td></tr>
                         ) : (
                           filteredOrders.map(order => (
                             <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                               <td className="p-3 md:p-4 whitespace-nowrap">
                                  <div className="mb-2">
                                    {order.status === 'assigned' && <span className="px-2 py-1 bg-white border border-gray-300 text-gray-800 rounded text-[11px] font-bold shadow-sm whitespace-nowrap">배차</span>}
                                    {order.status === 'loaded' && <span className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold shadow-sm whitespace-nowrap">상차완료</span>}
                                    {order.status === 'completed' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[11px] font-bold whitespace-nowrap">운송완료</span>}
                                  </div>
                                  {order.assignedBy && <div className="text-[10px] font-bold text-indigo-500 mt-1.5">최초 배차: {order.assignedBy}</div>}
                                  {order.reassignedBy && (
                                    <div className="text-[10px] font-bold text-orange-500 mt-1">
                                      이관: {order.reassignedBy}
                                      <div className="text-[9px] text-gray-400 font-normal mt-0.5">{formatDate(order.reassignedAt)}</div>
                                    </div>
                                  )}
                               </td>
                               <td className="p-3 md:p-4 text-xs whitespace-nowrap">
                                 <div className="text-gray-500 mb-1">상차: <span className="font-bold text-blue-600">{order.loadedAt ? formatDate(order.loadedAt) : '대기중'}</span></div>
                                 <div className="text-gray-500">하차: <span className="font-bold text-gray-800">{order.completedAt ? formatDate(order.completedAt) : '대기중'}</span></div>
                               </td>
                               <td className="p-3 md:p-4 text-gray-700 text-[13px] md:text-sm">
                                  <div className="flex flex-wrap items-center gap-1 break-keep">
                                    <span>{order.loadingLoc}</span><ArrowRight size={12} className="text-gray-300 shrink-0"/><span>{order.unloadingLoc}</span>
                                  </div>
                               </td>
                               <td className="p-3 md:p-4">
                                 <div className="font-bold text-gray-800 text-[13px] md:text-sm break-keep">{order.equipment && <span className="text-blue-600 mr-1">[{order.equipment}]</span>}{order.productName}</div>
                                 <div className="text-[11px] text-red-500 font-bold mt-1 line-clamp-2">{order.notes}</div>
                               </td>
                               <td className="p-3 md:p-4 align-middle">
                                <div className="flex items-center gap-1">
                                 <select 
                                   value=""
                                   onChange={(e) => {
                                     if(!e.target.value) return;
                                     if(e.target.value === 'unassign') {
                                       showConfirm(`해당 배차를 '미배정' 상태로 변경하시겠습니까?`, () => {
                                         update(ref(db, 'orders/' + order.id), {
                                           driverId: null,
                                           reassignedBy: currentUser.name,
                                           reassignedAt: new Date().toISOString()
                                         });
                                       });
                                       return;
                                     }
                                     const targetDriverId = Number(e.target.value);
                                     const targetDriver = drivers.find(d => d.id === targetDriverId);
                                     showConfirm(`해당 배차를 '${targetDriver.vehicleNumber}' 기사님께 이관하시겠습니까?\n(진행/완료 상태 및 기록된 시간은 그대로 유지됩니다.)`, () => {
                                       update(ref(db, 'orders/' + order.id), {
                                         driverId: targetDriverId,
                                         reassignedBy: currentUser.name,
                                         reassignedAt: new Date().toISOString()
                                       });
                                     });
                                   }}
                                   className="w-full bg-white border border-gray-300 text-gray-600 px-2 py-1.5 rounded-lg text-[11px] font-bold shadow-sm outline-none cursor-pointer focus:border-blue-500 text-center transition-colors hover:bg-gray-50 truncate"
                                 >
                                   <option value="">이관</option>
                                   <option value="unassign">미배정</option>
                                   {drivers.filter(d => d.id !== selectedDriver.id).map(d => <option key={d.id} value={d.id}>{d.vehicleNumber}</option>)}
                                 </select>
                                 <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0" title="삭제"><Trash2 size={16}/></button>
                                </div>
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'statusChange' && (() => {
              const statusChangeOrders = orders.filter(o => {
                if (statusDriver === 'unassigned' && o.driverId !== null) return false;
                else if (statusDriver !== 'all' && statusDriver !== 'unassigned' && o.driverId !== Number(statusDriver)) return false;

                if (statusFilter !== 'all' && o.status !== statusFilter) return false;
                if (o.loadingTime) {
                  const orderDate = o.loadingTime.split(' ')[0];
                  if (statusStart && orderDate < statusStart) return false;
                  if (statusEnd && orderDate > statusEnd) return false;
                }
                return true;
              }).sort((a,b) => b.id - a.id);

              return (
                <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 w-full">
                  <div className="bg-blue-50 p-4 md:p-5 rounded-2xl border border-blue-200 shadow-sm flex items-start gap-3 md:gap-4 w-full">
                    <ArrowRightLeft className="text-blue-600 mt-1 shrink-0" size={20} md:size={24}/>
                    <div className="min-w-0">
                      <h3 className="font-bold text-blue-900 text-base md:text-lg truncate">운송 상태 강제 변경 구역</h3>
                      <p className="text-[12px] md:text-sm text-blue-700 mt-1 leading-relaxed break-keep">기사님이 상태를 잘못 누르거나 누락한 경우, 관리자가 여기서 상태를 자유롭게 앞/뒤로 변경할 수 있습니다.</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row flex-wrap gap-4 items-start lg:items-end w-full">
                    <div className="w-full lg:w-auto flex gap-3 md:gap-4 flex-col sm:flex-row">
                       <div className="flex-1 min-w-0">
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">시작일</label>
                         <input type="date" value={statusStart} onChange={e=>setStatusStart(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">종료일</label>
                         <input type="date" value={statusEnd} onChange={e=>setStatusEnd(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                       </div>
                    </div>
                    <div className="w-full lg:w-auto flex-1 flex flex-col sm:flex-row gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">기사 선택</label>
                        <select value={statusDriver} onChange={e=>setStatusDriver(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500 min-w-[130px] truncate">
                          <option value="all">전체 기사 보기</option>
                          <option value="unassigned">미배정 건 보기</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">현재 상태 조회</label>
                        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full p-3 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[16px] md:text-sm outline-none focus:ring-1 focus:ring-blue-500 min-w-[130px] truncate">
                          <option value="all">전체 배차 보기</option>
                          <option value="assigned">배차 (상차 전)</option>
                          <option value="loaded">상차완료 (운송 중)</option>
                          <option value="completed">하차완료(운송완료)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:gap-4 w-full">
                    {statusChangeOrders.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 font-bold bg-white rounded-2xl border border-gray-200 text-sm mx-1">조건에 일치하는 배차가 없습니다.</div>
                    ) : (
                      statusChangeOrders.map(order => {
                        const driver = drivers.find(d => d.id === order.driverId);
                        return (
                          <div key={order.id} className="bg-white p-4 md:p-6 rounded-2xl border-l-4 border-l-blue-500 border border-y-gray-200 border-r-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full overflow-hidden">
                            <div className="w-full min-w-0">
                              <div className="flex flex-wrap items-end gap-2 mb-2">
                                {driver ? (
                                  <>
                                    <span className="font-black text-lg md:text-xl text-blue-700 whitespace-nowrap">{driver.vehicleNumber}</span>
                                    <span className="text-xs md:text-sm font-bold text-gray-500 mb-0.5 whitespace-nowrap">{driver.name} 기사님</span>
                                  </>
                                ) : (
                                  <span className="font-black text-[13px] md:text-sm text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-lg shrink-0">미배정</span>
                                )}
                                <span className="text-[10px] md:text-xs text-gray-400 ml-0 md:ml-2 mb-0.5 w-full sm:w-auto truncate mt-1 sm:mt-0">ORDER #{order.id} {order.assignedBy && `| 배차: ${order.assignedBy}`}</span>
                              </div>
                              <div className="text-gray-700 text-sm md:text-base font-medium mb-1.5 flex flex-wrap items-center gap-1 leading-tight break-keep">
                                <span>{order.loadingLoc}</span> <ArrowRight size={14} className="text-gray-400 shrink-0"/> <span>{order.unloadingLoc}</span>
                              </div>
                              <div className="text-[11px] md:text-sm font-bold text-blue-600">현재 상태: {order.status === 'assigned' ? '배차 (상차 전)' : order.status === 'loaded' ? '상차완료 (운송 중)' : '하차완료(운송완료)'}</div>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto bg-gray-50 p-2 md:p-2 rounded-xl border border-gray-200 shrink-0">
                              <span className="text-[11px] md:text-xs font-bold text-gray-500 whitespace-nowrap pl-1 md:pl-2 shrink-0">상태 변경:</span>
                              <select 
                                value={order.status}
                                onChange={(e) => handleAdminStatusChange(order.id, e.target.value)}
                                className="w-full md:w-48 bg-white border border-gray-300 text-gray-800 px-2 md:px-3 py-2.5 rounded-lg text-[13px] md:text-sm font-bold shadow-sm outline-none cursor-pointer focus:border-blue-500 text-center transition-colors active:bg-gray-100 min-w-0"
                              >
                                <option value="assigned">배차 (상차 전)</option>
                                <option value="loaded">상차완료 (운송 중)</option>
                                <option value="completed">하차완료</option>
                              </select>
                              <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-500 p-2 md:p-2.5 bg-gray-50 md:bg-transparent rounded-lg transition-all shrink-0 ml-1" title="삭제"><Trash2 size={18}/></button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </main>
        </div>

        {editingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm overflow-y-auto pt-16 pb-10">
            <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-8 max-w-4xl w-full my-auto">
              <div className="flex justify-between items-center mb-5 md:mb-6">
                <h2 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate pr-2"><Edit size={22} className="text-blue-600 shrink-0"/> 운송 오더 내용 수정</h2>
                <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-100 px-2.5 md:px-3 py-1.5 rounded-full shrink-0">ORDER #{editingOrder.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-4 w-full">
                <div className="w-full min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지</label>
                  <input value={editingOrder.loadingLoc} onChange={e=>setEditingOrder({...editingOrder, loadingLoc: e.target.value})} className="w-full p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="주소 입력" />
                </div>
                <div className="w-full min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차 일시</label>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                        <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                        <input type="text" maxLength="2" value={editingOrder.loadingMonth} onChange={e=>{
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditingOrder({...editingOrder, loadingMonth: val});
                          if(val.length === 2 && editLoadDayRef.current) editLoadDayRef.current.focus();
                        }} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                        <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                        <input type="text" maxLength="2" ref={editLoadDayRef} value={editingOrder.loadingDay} onChange={e=>setEditingOrder({...editingOrder, loadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <select value={editingOrder.loadingHour} onChange={e=>setEditingOrder({...editingOrder, loadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm min-w-0">
                        {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                      </select>
                      <select value={editingOrder.loadingMin} onChange={e=>setEditingOrder({...editingOrder, loadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm min-w-0">
                        {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="w-full min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지</label>
                  <input value={editingOrder.unloadingLoc} onChange={e=>setEditingOrder({...editingOrder, unloadingLoc: e.target.value})} className="w-full p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="주소 입력" />
                </div>
                <div className="w-full min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차 일시</label>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="flex flex-1 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-1 focus-within:ring-gray-900 w-full">
                        <span className="text-gray-400 font-bold text-[14px] md:text-sm ml-1 md:ml-2 shrink-0">{year}년</span>
                        <input type="text" maxLength="2" value={editingOrder.unloadingMonth} onChange={e=>{
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditingOrder({...editingOrder, unloadingMonth: val});
                          if(val.length === 2 && editUnloadDayRef.current) editUnloadDayRef.current.focus();
                        }} className="w-full md:w-8 ml-1 md:ml-2 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="월" />
                        <span className="text-gray-400 font-bold text-[14px] md:text-sm shrink-0">/</span>
                        <input type="text" maxLength="2" ref={editUnloadDayRef} value={editingOrder.unloadingDay} onChange={e=>setEditingOrder({...editingOrder, unloadingDay: e.target.value.replace(/[^0-9]/g, '')})} className="w-full md:w-8 bg-transparent outline-none text-center font-bold text-gray-900 text-[16px] md:text-sm py-3 min-w-0" placeholder="일" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <select value={editingOrder.unloadingHour} onChange={e=>setEditingOrder({...editingOrder, unloadingHour: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm min-w-0">
                        {[...Array(24)].map((_, i) => <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}{'\uC2DC'}</option>)}
                      </select>
                      <select value={editingOrder.unloadingMin} onChange={e=>setEditingOrder({...editingOrder, unloadingMin: e.target.value})} className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm min-w-0">
                        {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}{'\uBD84'}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 w-full">
                <div className="col-span-1 min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">장비</label>
                  <input value={editingOrder.equipment} onChange={e=>setEditingOrder({...editingOrder, equipment: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: L/B" />
                </div>
                <div className="col-span-1 min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">제품명(호선)</label>
                  <input value={editingOrder.productName} onChange={e=>setEditingOrder({...editingOrder, productName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 코일 20톤" />
                </div>
                <div className="col-span-2 lg:col-span-1 min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">상차지 담당자 <span className="text-gray-400 font-normal">(선택)</span></label>
                  <input value={editingOrder.loadingManager} onChange={e=>setEditingOrder({...editingOrder, loadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 김상차 대리" />
                </div>
                <div className="col-span-2 lg:col-span-1 min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">하차지 담당자 <span className="text-gray-400 font-normal">(선택)</span></label>
                  <input value={editingOrder.unloadingManager} onChange={e=>setEditingOrder({...editingOrder, unloadingManager: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] md:text-sm transition-colors" placeholder="예: 이하차 주임" />
                </div>
              </div>

              <div className="mb-4 w-full">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">제원 <span className="text-gray-400 font-normal">(단위: mm / 선택)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                    <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] font-bold border-r border-gray-200 whitespace-nowrap shrink-0">길이</span>
                    <input value={editingOrder.productLength} onChange={e=>setEditingOrder({...editingOrder, productLength: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] min-w-0" placeholder="예: 12000" />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                    <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] font-bold border-r border-gray-200 whitespace-nowrap shrink-0">폭</span>
                    <input value={editingOrder.productWidth} onChange={e=>setEditingOrder({...editingOrder, productWidth: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] min-w-0" placeholder="예: 2400" />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden w-full">
                    <span className="px-3 md:px-4 py-3 bg-gray-100 text-gray-600 text-[14px] font-bold border-r border-gray-200 whitespace-nowrap shrink-0">높이</span>
                    <input value={editingOrder.productHeight} onChange={e=>setEditingOrder({...editingOrder, productHeight: e.target.value})} className="w-full p-3 bg-transparent outline-none text-[16px] min-w-0" placeholder="예: 2600" />
                  </div>
                </div>
              </div>

              <div className="mb-4 w-full">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">주의사항 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input value={editingOrder.notes} onChange={e=>setEditingOrder({...editingOrder, notes: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 text-[16px] transition-colors" placeholder="특이사항 입력" />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end mt-5 pt-5 border-t border-gray-100 w-full">
                <div className="w-full flex-1 min-w-0">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">기사 배정</label>
                  <select value={editingOrder.driverId} onChange={e=>setEditingOrder({...editingOrder, driverId: e.target.value})} className="w-full p-3.5 md:p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 text-[16px] transition-colors cursor-pointer focus:ring-1 focus:ring-gray-900 truncate">
                    <option value="">선등록 (기사 미배정)</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicleNumber} ({d.name})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6 w-full">
                <button onClick={() => setEditingOrder(null)} className="flex-1 md:flex-none px-6 py-3.5 md:py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-[15px] md:text-base">취소</button>
                <button onClick={handleSaveEdit} className="flex-1 md:flex-none px-8 py-3.5 md:py-3 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-[15px] md:text-base">수정 내용 저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== 메인 렌더링 ====================
  return (
    <>
      {!userType && <LoginScreen />}
      {userType === 'driver' && <DriverApp />}
      {userType === 'admin' && <AdminDashboard />}

      {modal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all mx-2">
            <p className="text-gray-800 text-[15px] md:text-base font-bold mb-6 md:mb-8 whitespace-pre-wrap leading-relaxed text-center mt-2 md:mt-4 break-keep">{modal.message}</p>
            <div className="flex gap-2 justify-end w-full">
              {modal.type === 'confirm' && (
                <button onClick={closeModal} className="flex-1 px-4 py-3.5 md:py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-sm md:text-base select-none">취소</button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className="flex-1 px-4 py-3.5 md:py-3.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 active:scale-95 transition-all text-sm md:text-base select-none"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
