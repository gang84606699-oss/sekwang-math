import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [problems, setProblems] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 5; 
  
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomCount, setRandomCount] = useState(5);
  const [randomProblems, setRandomProblems] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [isTimeAttackMode, setIsTimeAttackMode] = useState(false);
  const [taStep, setTaStep] = useState('select'); 
  const [taSubjMode, setTaSubjMode] = useState('all'); 
  const [taSelectedSubjs, setTaSelectedSubjs] = useState([]);
  const [taUnitMode, setTaUnitMode] = useState('all'); 
  const [taSelectedUnits, setTaSelectedUnits] = useState([]);
  const [taGrade, setTaGrade] = useState('전체');
  
  const [taProblem, setTaProblem] = useState(null);
  const [taAnswer, setTaAnswer] = useState('');
  const [taSubmitted, setTaSubmitted] = useState(false);
  const [taCorrect, setTaCorrect] = useState(false);
  const [taTime, setTaTime] = useState(0);
  const [taTimerActive, setTaTimerActive] = useState(false);

  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankModeType, setRankModeType] = useState('');
  const [rankScoreValue, setRankScoreValue] = useState(0);
  const [rankDetailInfo, setRankDetailInfo] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  
  const [isSubmittingRank, setIsSubmittingRank] = useState(false);

  const [editingRank, setEditingRank] = useState(null);
  const [editRankName, setEditRankName] = useState('');
  
  const [rankCurrentPage, setRankCurrentPage] = useState(1);
  const rankItemsPerPage = 10;

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  
  const [customId, setCustomId] = useState('');
  const [formSub, setFormSub] = useState('수학I');
  const [formUnit, setFormUnit] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formErrorRate, setFormErrorRate] = useState('');
  const [formType, setFormType] = useState('객관식');
  const [formObjAns, setFormObjAns] = useState('1'); 
  const [formSubjAns, setFormSubjAns] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMHYAPF2V1tzJFzeqTXY4-ce5C_w20rxOz5mqVIpTkcM-9kEehg5etgh3X33a35rxRQ/exec';

  const derivedSubjects = Array.from(new Set(problems.map(p => String(p.과목 || '').trim()).filter(Boolean)));
  const SUBJECTS = derivedSubjects.length > 0 ? derivedSubjects : ['수학I', '수학II', '확률과 통계'];

  const UNIT_MAP = {};
  SUBJECTS.forEach(s => UNIT_MAP[s] = []);
  problems.forEach(p => {
    const s = String(p.과목 || '').trim();
    const u = String(p.세부단원 || '').trim();
    if (s && u) {
      if (!UNIT_MAP[s]) UNIT_MAP[s] = [];
      if (!UNIT_MAP[s].includes(u)) UNIT_MAP[s].push(u);
    }
  });

  const GRADE_LIST = [
    { name: '신', desc: '85% 이상' },
    { name: '초인', desc: '70~84%' },
    { name: '고수', desc: '50~69%' },
    { name: '도전', desc: '30~49%' },
    { name: '초보', desc: '30% 미만' }
  ];

  const getDifficultyGrade = (rate) => {
    const r = Number(rate);
    if (isNaN(r)) return { name: '정보없음', color: '#6c757d' };
    if (r >= 85) return { name: '신', color: '#dc3545' };
    if (r >= 70) return { name: '초인', color: '#fd7e14' };
    if (r >= 50) return { name: '고수', color: '#ffc107' };
    if (r >= 30) return { name: '도전', color: '#17a2b8' };
    return { name: '초보', color: '#28a745' };
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    let interval = null;
    if (taTimerActive) {
      interval = setInterval(() => {
        setTaTime(prev => prev + 0.1);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [taTimerActive]);

  const fetchData = () => {
    axios.get(GAS_URL)
      .then(response => {
        setProblems(response.data.problems || []);
        // 💡 백엔드에서 받아온 랭킹 데이터의 키(Key) 값들에 있는 공백을 모두 제거해 통일시킵니다.
        const cleanedRankings = (response.data.rankings || []).map(r => {
          const newObj = {};
          for (const key in r) {
            newObj[key.trim()] = r[key];
          }
          return newObj;
        });
        setRankings(cleanedRankings);
        
        setLoading(false);
        if (response.data.problems && response.data.problems.length > 0) {
          const lastId = Number(response.data.problems[response.data.problems.length - 1].문제ID) || 260901;
          setCustomId(String(lastId + 1));
        } else {
          setCustomId('260901');
        }
      })
      .catch(error => {
        console.error('데이터 로드 실패:', error);
        setLoading(false);
      });
  };

  const toCircled = (num) => {
    const circledMap = { '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤' };
    return circledMap[String(num).trim()] || num;
  };

  const handleSelect = (index, choice) => {
    setUserAnswers({ ...userAnswers, [index]: choice });
  };

  const handleCheck = (index) => {
    const newShowResults = { ...showResults, [index]: true };
    setShowResults(newShowResults);

    if (isRandomMode) {
      const allChecked = randomProblems.every((_, idx) => newShowResults[idx]);
      if (allChecked && timerActive) {
        setTimerActive(false);
      }
    }
  };

  const handleAdminLogin = () => {
    if (adminPw === '1932') {
      setIsAdmin(true);
      alert('관리자 모드로 전환되었습니다.');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const toggleSubjectFilter = (subj) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
    setIsRandomMode(false); setIsTimeAttackMode(false); setCurrentPage(1);
  };

  const toggleUnitFilter = (unit) => {
    if (selectedUnits.includes(unit)) {
      setSelectedUnits(selectedUnits.filter(u => u !== unit));
    } else {
      setSelectedUnits([...selectedUnits, unit]);
    }
    setIsRandomMode(false); setIsTimeAttackMode(false); setCurrentPage(1);
  };

  const toggleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setIsRandomMode(false); setIsTimeAttackMode(false); setCurrentPage(1);
  };

  const toggleGradeFilter = (grade) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
    setIsRandomMode(false); setIsTimeAttackMode(false); setCurrentPage(1);
  };

  const handleStartRandom = () => {
    let pool = problems;
    
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      pool = pool.filter(p => 
        String(p.문제ID).includes(keyword) || 
        String(p.태그 || '').toLowerCase().includes(keyword) ||
        String(p.과목 || '').toLowerCase().includes(keyword) ||
        String(p.세부단원 || '').toLowerCase().includes(keyword)
      );
    }
    
    if (selectedSubjects.length > 0) pool = pool.filter(p => selectedSubjects.includes(String(p.과목).trim()));
    if (selectedUnits.length > 0) pool = pool.filter(p => selectedUnits.includes(String(p.세부단원).trim()));
    if (selectedTags.length > 0) pool = pool.filter(p => {
      const pTags = String(p.태그 || '').split(',').map(t => t.trim());
      return selectedTags.some(t => pTags.includes(t));
    });
    if (selectedGrades.length > 0) pool = pool.filter(p => selectedGrades.includes(getDifficultyGrade(p.오답률).name));

    if (pool.length === 0) return alert('선택한 조건에 해당하는 문제가 없습니다!');

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setRandomProblems(shuffled.slice(0, Number(randomCount)));
    setIsRandomMode(true); setIsTimeAttackMode(false);
    setUserAnswers({}); setShowResults({}); setElapsedSeconds(0); setTimerActive(true); setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTimeAttackSelector = () => {
    setIsTimeAttackMode(true); setTaStep('select'); setTaSubjMode('all'); setTaSelectedSubjs([]);
    setTaUnitMode('all'); setTaSelectedUnits([]); setTaGrade('전체'); setIsRandomMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTaSubject = (subj) => taSelectedSubjs.includes(subj) ? setTaSelectedSubjs(taSelectedSubjs.filter(s => s !== subj)) : setTaSelectedSubjs([...taSelectedSubjs, subj]);
  const toggleTaUnit = (unit) => taSelectedUnits.includes(unit) ? setTaSelectedUnits(taSelectedUnits.filter(u => u !== unit)) : setTaSelectedUnits([...taSelectedUnits, unit]);

  const handleStartActualTimeAttack = () => {
    let pool = problems;

    if (taSubjMode === 'custom') {
      if (taSelectedSubjs.length === 0) return alert('최소 한 개 이상의 과목을 선택해주세요!');
      pool = pool.filter(p => taSelectedSubjs.includes(String(p.과목).trim()));
    }
    if (taUnitMode === 'custom') {
      if (taSelectedUnits.length === 0) return alert('최소 한 개 이상의 단원을 선택해주세요!');
      pool = pool.filter(p => taSelectedUnits.includes(String(p.세부단원).trim()));
    }
    if (taGrade !== '전체') pool = pool.filter(p => getDifficultyGrade(p.오답률).name === taGrade);

    if (pool.length === 0) return alert('선택한 조건에 해당하는 문제가 없습니다!');

    setTaProblem(pool[Math.floor(Math.random() * pool.length)]);
    setTaAnswer(''); setTaSubmitted(false); setTaCorrect(false); setTaTime(0); setTaStep('playing'); setTaTimerActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckTimeAttack = () => {
    if (!taAnswer) return alert('정답을 입력하거나 선택해주세요!');
    setTaTimerActive(false); setTaSubmitted(true);

    const objAns = String(taProblem['객관식 답'] || '').trim();
    const subjAns = String(taProblem['주관식 답'] || '').trim();
    const isSubjective = !objAns;
    const correctAns = isSubjective ? subjAns : objAns;
    const correct = isSubjective ? String(taAnswer).trim().toLowerCase() === correctAns.toLowerCase() : String(taAnswer).trim() === correctAns;

    setTaCorrect(correct);
  };

  const openRankModal = (mode, score, detail) => {
    setRankModeType(mode);
    setRankScoreValue(score);
    setRankDetailInfo(detail);
    setStudentNameInput('');
    setRankModalOpen(true);
  };

  const submitRankingData = () => {
    if (!studentNameInput.trim()) return alert('학번과 이름을 입력해주세요! (예: 30105 홍길동)');
    if (isSubmittingRank) return;
    setIsSubmittingRank(true); 

    const formData = new URLSearchParams();
    formData.append('action', 'addRank');
    formData.append('모드', rankModeType === 'set' ? `랜덤 ${randomProblems.length}문항` : '타임어택');
    formData.append('학번이름', studentNameInput.trim());
    formData.append('기록', rankScoreValue);
    formData.append('세부정보', rankDetailInfo);

    axios.post(GAS_URL, formData)
      .then(() => {
        alert('명예의 전당에 성공적으로 등록되었습니다!');
        setRankModalOpen(false);
        fetchData();
      })
      .catch(() => {
        alert('랭킹 등록 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setIsSubmittingRank(false); 
      });
  };

  const handleSaveRankEdit = (item) => {
    const formData = new URLSearchParams();
    formData.append('action', 'updateRankNameOnly');
    formData.append('rowIndex', item.rowIndex);
    formData.append('학번이름', editRankName);

    axios.post(GAS_URL, formData)
      .then(() => {
        alert('학생 이름이 수정되었습니다.');
        setEditingRank(null);
        fetchData();
      })
      .catch(() => alert('수정 중 오류가 발생했습니다.'));
  };

  const handleDeleteRank = (item) => {
    if (!window.confirm(`[${item.학번이름}]의 기록을 삭제하시겠습니까?`)) return;
    const formData = new URLSearchParams();
    formData.append('action', 'deleteRank');
    formData.append('rowIndex', item.rowIndex);
    axios.post(GAS_URL, formData)
      .then(() => {
        alert('랭킹 기록이 삭제되었습니다.');
        fetchData();
      })
      .catch(() => alert('삭제 중 오류가 발생했습니다.'));
  };

  const handleSubmitProblem = (e) => {
    e.preventDefault();
    if (!customId) return alert('문제 ID를 입력해주세요!');
    setProcessing(true);
    const formData = new URLSearchParams();
    formData.append('action', isEditing ? 'update' : 'add');
    formData.append('문제ID', customId); formData.append('과목', formSub); formData.append('세부단원', formUnit);
    formData.append('태그', formTag); formData.append('오답률', formErrorRate);
    formData.append('객관식 답', formType === '객관식' ? formObjAns : '');
    formData.append('주관식 답', formType === '주관식' ? formSubjAns : '');

    axios.post(GAS_URL, formData)
      .then(() => {
        alert(isEditing ? '문제가 수정되었습니다!' : '문제가 등록되었습니다!');
        resetForm(); setProcessing(false); fetchData();
      })
      .catch(err => {
        console.error('처리 실패:', err); alert('처리 중 오류가 발생했습니다.'); setProcessing(false);
      });
  };

  const handleStartEdit = (prob) => {
    setIsEditing(true); setCustomId(String(prob.문제ID || '')); setFormSub(prob.과목 || '수학I');
    setFormUnit(prob.세부단원 || ''); setFormTag(prob.태그 || ''); setFormErrorRate(prob.오답률 || '');
    const objAns = prob['객관식 답'] ? String(prob['객관식 답']).trim() : '';
    const subjAns = prob['주관식 답'] ? String(prob['주관식 답']).trim() : '';
    
    if (objAns) { setFormType('객관식'); setFormObjAns(objAns); setFormSubjAns(''); } 
    else { setFormType('주관식'); setFormObjAns('1'); setFormSubjAns(subjAns); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (problemId) => {
    if (!window.confirm(`문제 ID [${problemId}]를 삭제하시겠습니까?`)) return;
    const formData = new URLSearchParams();
    formData.append('action', 'delete');
    formData.append('문제ID', problemId);
    axios.post(GAS_URL, formData)
      .then(() => { alert('문제가 삭제되었습니다.'); fetchData(); })
      .catch(err => alert('삭제 중 오류가 발생했습니다.'));
  };

  const resetForm = () => {
    setIsEditing(false);
    const nextId = problems.length > 0 ? Number(problems[problems.length - 1].문제ID) + 1 : 260901;
    setCustomId(String(nextId)); setFormTag(''); setFormErrorRate(''); setFormType('객관식'); setFormObjAns('1'); setFormSubjAns('');
  };

  const sendFeedback = () => {
    if (!feedbackText.trim()) return alert('피드백 내용을 입력해주세요!');
    const formData = new URLSearchParams();
    formData.append('action', 'feedback'); formData.append('문제ID', feedbackTargetId); formData.append('피드백내용', feedbackText);
    axios.post(GAS_URL, formData)
      .then(() => {
        alert('선생님께 피드백이 성공적으로 전송되었습니다! 감사합니다.');
        setFeedbackModalOpen(false); setFeedbackText('');
      })
      .catch(() => alert('전송 중 오류가 발생했습니다.'));
  };

  const allTags = Array.from(new Set(problems.flatMap(p => String(p.태그 || '').split(',').map(t => t.trim())).filter(Boolean)));
  const displayedProblems = isRandomMode 
    ? randomProblems 
    : problems.filter(p => {
        const keyword = searchKeyword.trim().toLowerCase();
        const matchKeyword = !keyword || String(p.문제ID).includes(keyword) || String(p.태그 || '').toLowerCase().includes(keyword) || String(p.과목 || '').toLowerCase().includes(keyword) || String(p.세부단원 || '').toLowerCase().includes(keyword);
        const matchSubj = selectedSubjects.length === 0 || selectedSubjects.includes(String(p.과목).trim());
        const matchUnit = selectedUnits.length === 0 || selectedUnits.includes(String(p.세부단원).trim());
        const pTags = String(p.태그 || '').split(',').map(t => t.trim());
        const matchTag = selectedTags.length === 0 || selectedTags.some(t => pTags.includes(t));
        const grade = getDifficultyGrade(p.오답률).name;
        const matchGrade = selectedGrades.length === 0 || selectedGrades.includes(grade);
        return matchKeyword && matchSubj && matchUnit && matchTag && matchGrade;
      });

  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentDisplayedProblems = displayedProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.max(1, Math.ceil(displayedProblems.length / problemsPerPage));

  const availableUnits = selectedSubjects.length > 0 ? Array.from(new Set(selectedSubjects.flatMap(subj => UNIT_MAP[subj] || []))) : Array.from(new Set(problems.map(p => p.세부단원).filter(Boolean)));
  const allSetChecked = isRandomMode && randomProblems.length > 0 && randomProblems.every((_, idx) => showResults[idx]);
  
  // 💡 랭킹 데이터 필터링 조건 완화 (공백 제거나 문자열 포함 등 느슨하게 매칭)
  const enrichedRankings = rankings
    .filter(r => {
      const modeStr = String(r['모드'] || '').replace(/\s+/g, '');
      return modeStr.includes('타임어택');
    })
    .map(r => {
      const problemId = String(r['세부정보'] || '').replace('ID:', '').trim();
      const problemInfo = problems.find(p => String(p.문제ID) === problemId);
      const difficulty = problemInfo && problemInfo.오답률 !== undefined && problemInfo.오답률 !== '' 
        ? Number(problemInfo.오답률) 
        : 0;
      
      return {
        ...r,
        actualProblemId: problemId,
        difficulty: difficulty,
        time: Number(r['기록']) || 0,
        학번이름: String(r['학번이름'] || '') // 명시적으로 한 번 더 잡아줌
      };
    });

  const difficultyRankings = [...enrichedRankings].sort((a, b) => {
    if (b.difficulty !== a.difficulty) {
      return b.difficulty - a.difficulty; 
    }
    return a.time - b.time;
  });

  const timeRankings = [...enrichedRankings].sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    return b.difficulty - a.difficulty;
  });

  const rankTotalItems = Math.max(difficultyRankings.length, timeRankings.length);
  const rankTotalPages = Math.ceil(rankTotalItems / rankItemsPerPage) || 1;
  const indexOfLastRank = rankCurrentPage * rankItemsPerPage;
  const indexOfFirstRank = indexOfLastRank - rankItemsPerPage;
  
  const currentDiffData = difficultyRankings.slice(indexOfFirstRank, indexOfLastRank);
  const currentTimeData = timeRankings.slice(indexOfFirstRank, indexOfLastRank);

  const renderRankBadge = (rank) => {
    if (rank === 1) return '🥇 1위';
    if (rank === 2) return '🥈 2위';
    if (rank === 3) return '🥉 3위';
    return `${rank}위`;
  };
  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* 상단 타이틀 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div></div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ color: '#333', margin: 0, fontSize: '26px' }}>광기분: 세광고 학생들의 기출분석</h1>
          <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>세광고 학생들의 문제풀이 능력 향상을 위한 웹</p>
        </div>
        <div>
          {!isAdmin ? (
            <div style={{ display: 'flex', gap: '5px' }}>
              <input 
                type="password" 
                placeholder="관리자 PW" 
                value={adminPw} 
                onChange={(e) => setAdminPw(e.target.value)}
                style={{ padding: '5px', width: '80px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
              />
              <button onClick={handleAdminLogin} style={{ padding: '5px 10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>로그인</button>
            </div>
          ) : (
            <span style={{ background: '#28a745', color: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>관리자 ON</span>
          )}
        </div>
      </div>

      <hr style={{ margin: '15px 0' }} />

      {/* 검색 및 필터 패널 */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start', textAlign: 'left' }}>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#444', minWidth: '110px' }}>🔍 통합 검색:</span>
          <input 
            type="text" 
            placeholder="문제 ID, 태그, 과목, 단원 등을 검색하세요 (예: 2609, 킬러문항)" 
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setIsRandomMode(false); setIsTimeAttackMode(false); setCurrentPage(1); }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
          />
          {searchKeyword && (
            <button 
              onClick={() => { setSearchKeyword(''); setCurrentPage(1); }}
              style={{ padding: '8px 12px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              검색 초기화
            </button>
          )}
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>📈 난이도 급간 선택 (오답률 기준):</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {GRADE_LIST.map((gradeObj) => {
              const isSelected = selectedGrades.includes(gradeObj.name);
              return (
                <button
                  key={gradeObj.name}
                  onClick={() => toggleGradeFilter(gradeObj.name)}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: isSelected ? '2px solid #dc3545' : '1px solid #ccc', background: isSelected ? '#dc3545' : '#fff', color: isSelected ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {isSelected ? `✔ ${gradeObj.name} (${gradeObj.desc})` : `${gradeObj.name} (${gradeObj.desc})`}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>📚 과목 선택 (다중 선택):</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {SUBJECTS.map((subj) => {
              const isSelected = selectedSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  onClick={() => toggleSubjectFilter(subj)}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: isSelected ? '2px solid #007bff' : '1px solid #ccc', background: isSelected ? '#007bff' : '#fff', color: isSelected ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {isSelected ? `✔ ${subj}` : subj}
                </button>
              );
            })}
          </div>
        </div>

        {availableUnits.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>🏷️ 세부단원 선택 (다중 선택):</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {availableUnits.map((unit) => {
                const isSelected = selectedUnits.includes(unit);
                return (
                  <button
                    key={unit}
                    onClick={() => toggleUnitFilter(unit)}
                    style={{ padding: '5px 12px', borderRadius: '15px', border: isSelected ? '2px solid #28a745' : '1px solid #ccc', background: isSelected ? '#28a745' : '#fff', color: isSelected ? '#fff' : '#333', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {isSelected ? `✔ ${unit}` : unit}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {allTags.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>🔖 태그 선택 (콤마 구분 다중 필터):</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    style={{ padding: '5px 12px', borderRadius: '15px', border: isSelected ? '2px solid #6f42c1' : '1px solid #ccc', background: isSelected ? '#6f42c1' : '#fff', color: isSelected ? '#fff' : '#333', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {isSelected ? `✔ #${tag}` : `#${tag}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ background: '#f1f3f5', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>🎲 랜덤 문제 뽑기:</span>
            <select 
              value={randomCount} 
              onChange={(e) => setRandomCount(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="1">1문항 (가볍게 풀기)</option>
              <option value="3">3문항</option>
              <option value="5">5문항</option>
              <option value="10">10문항</option>
              <option value="15">15문항</option>
            </select>
            <button 
              onClick={handleStartRandom}
              style={{ padding: '7px 15px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              🎲 랜덤 문제 풀기 시작
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleOpenTimeAttackSelector}
              style={{ padding: '7px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              ⚡ 1문제 타임어택 도전
            </button>
            {(isRandomMode || isTimeAttackMode) && (
              <button 
                onClick={() => { setIsRandomMode(false); setIsTimeAttackMode(false); setTimerActive(false); setTaTimerActive(false); setCurrentPage(1); }}
                style={{ padding: '7px 12px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                전체 목록으로 복귀
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⏱️ 랜덤 세트 타이머 */}
      {isRandomMode && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#856404' }}>⏱️ 랜덤 {randomProblems.length}문항 풀이 진행 중</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>모든 문제의 정답을 확인하면 소요 시간이 측정됩니다.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9534f' }}>
              {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초
            </span>
            {allSetChecked && (
              <button 
                onClick={() => openRankModal('set', elapsedSeconds, `${randomProblems.length}문항 세트`)}
                style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                🏆 명예의 전당 등록하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* ⚡ 타임어택 카테고리 선택 및 플레이 화면 */}
      {isTimeAttackMode && (
        <div style={{ border: '2px solid #dc3545', padding: '25px', borderRadius: '12px', marginBottom: '30px', background: '#fff', boxShadow: '0 4px 12px rgba(220,53,69,0.15)' }}>
          
          {taStep === 'select' ? (
            <div>
              <h3 style={{ margin: '0 0 15px 0', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ 타임어택 카테고리 선택</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', marginBottom: '25px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>📚 과목 범위:</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <button onClick={() => { setTaSubjMode('all'); setTaSelectedSubjs([]); }} style={{ padding: '6px 14px', borderRadius: '15px', border: taSubjMode === 'all' ? '2px solid #dc3545' : '1px solid #ccc', background: taSubjMode === 'all' ? '#dc3545' : '#fff', color: taSubjMode === 'all' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>전체 과목</button>
                    <button onClick={() => setTaSubjMode('custom')} style={{ padding: '6px 14px', borderRadius: '15px', border: taSubjMode === 'custom' ? '2px solid #dc3545' : '1px solid #ccc', background: taSubjMode === 'custom' ? '#dc3545' : '#fff', color: taSubjMode === 'custom' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>과목 직접 선택 (중복 가능)</button>
                  </div>
                  {taSubjMode === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                      {SUBJECTS.map(subj => {
                        const isChecked = taSelectedSubjs.includes(subj);
                        return <button key={subj} onClick={() => toggleTaSubject(subj)} style={{ padding: '5px 12px', borderRadius: '15px', border: isChecked ? '2px solid #007bff' : '1px solid #ccc', background: isChecked ? '#007bff' : '#fff', color: isChecked ? '#fff' : '#333', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>{isChecked ? `✔ ${subj}` : subj}</button>;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>🏷️ 세부단원 범위:</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <button onClick={() => { setTaUnitMode('all'); setTaSelectedUnits([]); }} style={{ padding: '6px 14px', borderRadius: '15px', border: taUnitMode === 'all' ? '2px solid #dc3545' : '1px solid #ccc', background: taUnitMode === 'all' ? '#dc3545' : '#fff', color: taUnitMode === 'all' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>전체 단원</button>
                    <button onClick={() => setTaUnitMode('custom')} style={{ padding: '6px 14px', borderRadius: '15px', border: taUnitMode === 'custom' ? '2px solid #dc3545' : '1px solid #ccc', background: taUnitMode === 'custom' ? '#dc3545' : '#fff', color: taUnitMode === 'custom' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>단원 직접 선택 (중복 가능)</button>
                  </div>
                  {taUnitMode === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                      {taAvailableUnits.map(unit => {
                        const isChecked = taSelectedUnits.includes(unit);
                        return <button key={unit} onClick={() => toggleTaUnit(unit)} style={{ padding: '5px 10px', borderRadius: '12px', border: isChecked ? '2px solid #28a745' : '1px solid #ccc', background: isChecked ? '#28a745' : '#fff', color: isChecked ? '#fff' : '#333', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>{isChecked ? `✔ ${unit}` : unit}</button>;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>📈 난이도 급간:</label>
                  <select value={taGrade} onChange={(e) => setTaGrade(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
                    <option value="전체">전체 난이도 (모든 급간 무작위)</option>
                    {GRADE_LIST.map(g => <option key={g.name} value={g.name}>{g.name} 급간 ({g.desc})</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleStartActualTimeAttack} style={{ padding: '12px 25px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>🚀 타임어택 스피드 측정 시작!</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ background: '#dc3545', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
                    ⚡ 타임어택 진행중 ({taSubjMode === 'all' ? '전체과목' : taSelectedSubjs.join(', ')} / {taUnitMode === 'all' ? '전체단원' : `${taSelectedUnits.length}개단원`} / {taGrade === '전체' ? '전체난이도' : taGrade})
                  </span>
                  <button onClick={() => setTaStep('select')} style={{ padding: '5px 10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>카테고리 재선택</button>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>{taTime.toFixed(1)}초</span>
              </div>

              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                <div style={{ flex: '1 1 500px', textAlign: 'center', background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #eee', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <img 
                    src={encodeURI(`/세광고_문제이미지/${String(taProblem.문제ID).trim()}.png`)} 
                    alt="타임어택 문제" 
                    style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', maxHeight: '600px' }} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <p style={{ color: '#999', fontStyle: 'italic', display: 'none', margin: 0 }}>
                    ⚠️ '세광고_문제이미지' 폴더에 일치하는 이미지 파일({taProblem.문제ID}.png)이 없습니다.
                  </p>
                </div>

                <div style={{ flex: '1 1 300px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>✍️ 빠른 정답 입력</h4>
                    {taProblem && !String(taProblem['객관식 답'] || '').trim() ? (
                      <input 
                        type="text" 
                        placeholder="주관식 정답 입력" 
                        value={taAnswer}
                        onChange={(e) => setTaAnswer(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                        {['1', '2', '3', '4', '5'].map((num) => (
                          <button
                            key={num}
                            onClick={() => setTaAnswer(num)}
                            style={{
                              width: '55px', height: '55px', borderRadius: '50%',
                              border: taAnswer === num ? '2px solid #dc3545' : '1px solid #ccc', background: taAnswer === num ? '#dc3545' : '#fff', color: taAnswer === num ? '#fff' : '#333',
                              fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            {toCircled(num)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!taSubmitted ? (
                    <button onClick={handleCheckTimeAttack} style={{ padding: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                      정답 제출 및 기록 측정
                    </button>
                  ) : (
                    <div style={{ padding: '15px', borderRadius: '6px', background: taCorrect ? '#d4edda' : '#f8d7da', color: taCorrect ? '#155724' : '#721c24', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '18px' }}>
                        {taCorrect ? `🎉 정답! 기록: ${taTime.toFixed(1)}초` : '❌ 틀렸습니다!'}
                      </span>
                      {taCorrect && (
                        <button onClick={() => openRankModal('timeattack', Number(taTime.toFixed(1)), `ID: ${taProblem.문제ID}`)} style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                          🏆 타임어택 랭킹 등록하기
                        </button>
                      )}
                      <button onClick={handleStartActualTimeAttack} style={{ padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '5px' }}>
                        같은 조건으로 다시 도전
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 🏆 랭킹 시스템 (5열 포맷 일괄 적용) */}
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '35px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e9ecef' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>👑 세광고 명예의 전당 (랭킹 시스템)</h2>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* 왼쪽: 난이도 랭킹 */}
          <div style={{ flex: 1, minWidth: '350px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c', textAlign: 'center' }}>🔥 난이도 랭킹</h4>
            {currentDiffData.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px', textAlign: 'center' }}>등록된 기록이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px' }}>순위</th>
                    <th style={{ padding: '10px' }}>이름</th>
                    <th style={{ padding: '10px' }}>문제</th>
                    <th style={{ padding: '10px' }}>난이도</th>
                    <th style={{ padding: '10px' }}>시간</th>
                    {isAdmin && <th style={{ padding: '10px' }}>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentDiffData.map((item, idx) => {
                    const actualRank = indexOfFirstRank + idx + 1;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{renderRankBadge(actualRank)}</td>
                        {editingRank === item.rowIndex ? (
                          <>
                            <td style={{ padding: '6px' }}><input type="text" value={editRankName} onChange={(e) => setEditRankName(e.target.value)} style={{ width: '70px', padding: '4px', textAlign: 'center' }}/></td>
                            <td style={{ padding: '6px' }}>{item.actualProblemId}</td>
                            <td style={{ padding: '6px' }}>{item.difficulty}%</td>
                            <td style={{ padding: '6px' }}>{item.time}초</td>
                            <td style={{ padding: '6px' }}>
                              <button onClick={() => handleSaveRankEdit(item)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '4px 4px', borderRadius: '4px', cursor: 'pointer', marginRight: '2px', fontSize: '11px' }}>저장</button>
                              <button onClick={() => setEditingRank(null)} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>취소</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '10px' }}>{item.학번이름}</td>
                            <td style={{ padding: '10px' }}>{item.actualProblemId}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#e74c3c' }}>{item.difficulty}%</td>
                            <td style={{ padding: '10px' }}>{item.time}초</td>
                            {isAdmin && (
                              <td style={{ padding: '6px' }}>
                                <button onClick={() => { setEditingRank(item.rowIndex); setEditRankName(item.학번이름); }} style={{ background: '#ffc107', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>수정</button>
                                <button onClick={() => handleDeleteRank(item)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>삭제</button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 오른쪽: 타임어택 랭킹 */}
          <div style={{ flex: 1, minWidth: '350px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c', textAlign: 'center' }}>⚡ 타임어택 랭킹</h4>
            {currentTimeData.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px', textAlign: 'center' }}>등록된 기록이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px' }}>순위</th>
                    <th style={{ padding: '10px' }}>이름</th>
                    <th style={{ padding: '10px' }}>문제</th>
                    <th style={{ padding: '10px' }}>난이도</th>
                    <th style={{ padding: '10px' }}>시간</th>
                    {isAdmin && <th style={{ padding: '10px' }}>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentTimeData.map((item, idx) => {
                    const actualRank = indexOfFirstRank + idx + 1;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{renderRankBadge(actualRank)}</td>
                        {editingRank === item.rowIndex ? (
                          <>
                            <td style={{ padding: '6px' }}><input type="text" value={editRankName} onChange={(e) => setEditRankName(e.target.value)} style={{ width: '70px', padding: '4px', textAlign: 'center' }}/></td>
                            <td style={{ padding: '6px' }}>{item.actualProblemId}</td>
                            <td style={{ padding: '6px' }}>{item.difficulty}%</td>
                            <td style={{ padding: '6px' }}>{item.time}초</td>
                            <td style={{ padding: '6px' }}>
                              <button onClick={() => handleSaveRankEdit(item)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '4px 4px', borderRadius: '4px', cursor: 'pointer', marginRight: '2px', fontSize: '11px' }}>저장</button>
                              <button onClick={() => setEditingRank(null)} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>취소</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '10px' }}>{item.학번이름}</td>
                            <td style={{ padding: '10px' }}>{item.actualProblemId}</td>
                            <td style={{ padding: '10px' }}>{item.difficulty}%</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#e74c3c' }}>{item.time}초</td>
                            {isAdmin && (
                              <td style={{ padding: '6px' }}>
                                <button onClick={() => { setEditingRank(item.rowIndex); setEditRankName(item.학번이름); }} style={{ background: '#ffc107', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>수정</button>
                                <button onClick={() => handleDeleteRank(item)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>삭제</button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 랭킹 통합 내비게이션 바 */}
        {rankTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '25px' }}>
            <button 
              onClick={() => setRankCurrentPage(1)} 
              disabled={rankCurrentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: rankCurrentPage === 1 ? '#e9ecef' : '#f8f9fa', cursor: rankCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}
            >
              처음
            </button>
            <button 
              onClick={() => setRankCurrentPage(p => p - 1)} 
              disabled={rankCurrentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: rankCurrentPage === 1 ? '#e9ecef' : '#f8f9fa', cursor: rankCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}
            >
              이전
            </button>

            {(() => {
              let startPage = Math.max(1, rankCurrentPage - 2);
              let endPage = Math.min(rankTotalPages, startPage + 4);
              if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
              }
              
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setRankCurrentPage(i)}
                    style={{
                      padding: '6px 12px', borderRadius: '4px',
                      border: rankCurrentPage === i ? '1px solid #007bff' : '1px solid #ccc',
                      background: rankCurrentPage === i ? '#007bff' : '#fff',
                      color: rankCurrentPage === i ? '#fff' : '#333',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                    }}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button 
              onClick={() => setRankCurrentPage(p => p + 1)} 
              disabled={rankCurrentPage === rankTotalPages}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: rankCurrentPage === rankTotalPages ? '#e9ecef' : '#f8f9fa', cursor: rankCurrentPage === rankTotalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}
            >
              다음
            </button>
            <button 
              onClick={() => setRankCurrentPage(rankTotalPages)} 
              disabled={rankCurrentPage === rankTotalPages}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: rankCurrentPage === rankTotalPages ? '#e9ecef' : '#f8f9fa', cursor: rankCurrentPage === rankTotalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}
            >
              끝
            </button>
          </div>
        )}
      </div>

      {/* 관리자 등록 폼 */}
      {isAdmin && (
        <div style={{ background: '#e9ecef', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ced4da' }}>
          <h3>{isEditing ? `✏️ 문제 수정 (ID: ${customId})` : '➕ [선생님 전용] 신규 기출문제 등록'}</h3>
          <form onSubmit={handleSubmitProblem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>문제 ID:</label>
                <input 
                  type="text" value={customId} disabled={isEditing} onChange={(e) => setCustomId(e.target.value)} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: isEditing ? '#e9ecef' : '#fff' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>과목 (선택 또는 직접 입력):</label>
                <input 
                  list="subject-options" value={formSub} 
                  onChange={(e) => { const sub = e.target.value; setFormSub(sub); if (UNIT_MAP[sub] && UNIT_MAP[sub].length > 0 && !formUnit) setFormUnit(UNIT_MAP[sub][0]); }} 
                  placeholder="예: 대수, 미적분I" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <datalist id="subject-options">{SUBJECTS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>세부단원 (선택 또는 직접 입력):</label>
                <input 
                  list="unit-options" type="text" value={formUnit} onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="예: 지수와 로그" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <datalist id="unit-options">{(UNIT_MAP[formSub] || []).map(u => <option key={u} value={u} />)}</datalist>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>태그 (콤마로 구분, 예: 킬러문항, 빈출):</label>
                <input 
                  type="text" value={formTag} onChange={(e) => setFormTag(e.target.value)}
                  placeholder="예: 킬러문항, 3점, 로피탈" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>오답률 (%) 입력:</label>
                <input 
                  type="number" value={formErrorRate} onChange={(e) => setFormErrorRate(e.target.value)}
                  placeholder="예: 85 (숫자만 입력)" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>문제 유형:</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="객관식">객관식 (1~5번)</option>
                  <option value="주관식">주관식 (서답형)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>정답 설정:</label>
                {formType === '객관식' ? (
                  <select value={formObjAns} onChange={(e) => setFormObjAns(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="1">1번 (①)</option>
                    <option value="2">2번 (②)</option>
                    <option value="3">3번 (③)</option>
                    <option value="4">4번 (④)</option>
                    <option value="5">5번 (⑤)</option>
                  </select>
                ) : (
                  <input 
                    type="text" value={formSubjAns} onChange={(e) => setFormSubjAns(e.target.value)}
                    placeholder="주관식 정답 (예: 15)" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={processing} style={{ flex: 1, padding: '10px', background: processing ? '#6c757d' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                {processing ? '처리 중...' : (isEditing ? '문제 수정하기' : '구글 시트에 문제 등록')}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
              )}
            </div>
          </form>
        </div>
      )}
      
      {/* 일반 문제 리스트 영역 */}
      {!isTimeAttackMode && (
        loading ? (
          <p style={{ textAlign: 'center' }}>기출문제 데이터를 불러오는 중입니다...</p>
        ) : currentDisplayedProblems.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777' }}>조건에 맞는 문제가 없습니다.</p>
        ) : (
          <div>
            <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px', fontWeight: 'bold' }}>
              총 {displayedProblems.length}문제가 검색되었습니다. (페이지 {currentPage}/{totalPages})
            </div>
            {currentDisplayedProblems.map((prob) => {
              const index = problems.findIndex(p => p.문제ID === prob.문제ID);
              const selected = userAnswers[index];
              const isSubmitted = showResults[index];
              
              const objAns = String(prob['객관식 답'] || '').trim();
              const subjAns = String(prob['주관식 답'] || '').trim();
              const isSubjective = !objAns;
              const correctAns = isSubjective ? subjAns : objAns;
              
              const isCorrect = isSubjective 
                ? String(selected || '').trim().toLowerCase() === correctAns.toLowerCase()
                : selected === correctAns;

              const gradeInfo = getDifficultyGrade(prob.오답률);
              const tagList = String(prob.태그 || '').split(',').map(t => t.trim()).filter(Boolean);

              return (
                <div key={prob.문제ID} style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '12px', marginBottom: '30px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: '#007bff', color: '#fff', padding: '5px 12px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>{prob.과목 || '과목 미지정'}</span>
                      {prob.세부단원 && <span style={{ background: '#e2e6ea', color: '#333', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>{prob.세부단원}</span>}
                      {tagList.map((t, tIdx) => <span key={tIdx} style={{ background: '#6f42c1', color: '#fff', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>#{t}</span>)}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {prob.오답률 !== undefined && prob.오답률 !== '' && (
                        <span style={{ background: gradeInfo.color, color: '#fff', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>급간: {gradeInfo.name} (오답률 {prob.오답률}%)</span>
                      )}
                      <span style={{ color: '#555', fontSize: '14px', fontWeight: 'bold' }}>문제 ID: {prob.문제ID}</span>
                      <button onClick={() => { setFeedbackTargetId(prob.문제ID); setFeedbackModalOpen(true); }} style={{ padding: '4px 10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>💬 오류 신고·피드백</button>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleStartEdit(prob)} style={{ padding: '4px 10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>수정</button>
                          <button onClick={() => handleDelete(prob.문제ID)} style={{ padding: '4px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>삭제</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    
                    <div style={{ flex: '1 1 500px', textAlign: 'center', background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #eee', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <img 
                        src={encodeURI(`/세광고_문제이미지/${String(prob.문제ID).trim()}.png`)} 
                        alt="기출문제" 
                        style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', maxHeight: '600px' }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <p style={{ color: '#999', fontStyle: 'italic', display: 'none', margin: 0 }}>
                        ⚠️ '세광고_문제이미지' 폴더에 일치하는 이미지 파일({prob.문제ID}.png)이 없습니다.
                      </p>
                    </div>

                    <div style={{ flex: '1 1 300px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>✍️ 답안 작성</h4>
                        {!isSubjective ? (
                          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                            {['1', '2', '3', '4', '5'].map((num) => (
                              <button
                                key={num}
                                onClick={() => handleSelect(index, num)}
                                style={{
                                  width: '55px', height: '55px', borderRadius: '50%',
                                  border: selected === num ? '2px solid #007bff' : '1px solid #ccc',
                                  background: selected === num ? '#007bff' : '#fff',
                                  color: selected === num ? '#fff' : '#333',
                                  fontSize: '20px', fontWeight: 'bold', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                              >
                                {toCircled(num)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="주관식 정답을 입력하세요" 
                              value={selected || ''}
                              onChange={(e) => handleSelect(index, e.target.value)}
                              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                      </div>

                      <button onClick={() => handleCheck(index)} style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', width: '100%' }}>정답 확인</button>

                      {isSubmitted && (
                        <div style={{ padding: '15px', borderRadius: '6px', background: isCorrect ? '#d4edda' : '#f8d7da', color: isCorrect ? '#155724' : '#721c24', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                          <span style={{ fontSize: '18px' }}>{isCorrect ? '🎉 정답입니다!' : '❌ 틀렸습니다.'}</span>
                          <span style={{ fontSize: '14px', marginTop: '5px' }}>
                            정답: <strong style={{ fontSize: '20px' }}>{isSubjective ? correctAns : toCircled(correctAns)}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
            
            {/* 향상된 다이내믹 페이지네이션 UI 바 */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '30px', paddingBottom: '20px' }}>
                <button 
                  onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={currentPage === 1}
                  style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', background: currentPage === 1 ? '#e9ecef' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  처음
                </button>
                <button 
                  onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={currentPage === 1}
                  style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', background: currentPage === 1 ? '#e9ecef' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  이전
                </button>

                {(() => {
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, startPage + 4);
                  if (endPage - startPage < 4) {
                    startPage = Math.max(1, endPage - 4);
                  }
                  
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => { setCurrentPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '5px',
                          border: currentPage === i ? '1px solid #007bff' : '1px solid #ccc',
                          background: currentPage === i ? '#007bff' : '#fff',
                          color: currentPage === i ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}

                <button 
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={currentPage === totalPages}
                  style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', background: currentPage === totalPages ? '#e9ecef' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  다음
                </button>
                <button 
                  onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={currentPage === totalPages}
                  style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', background: currentPage === totalPages ? '#e9ecef' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  끝
                </button>
              </div>
            )}
            
          </div>
        )
      )}

      {/* 랭킹 등록 모달 및 피드백 모달 */}
      {rankModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🏆 명예의 전당 등록</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>기록: <strong style={{ color: '#d9534f' }}>{rankModeType === 'set' ? `${Math.floor(rankScoreValue / 60)}분 ${rankScoreValue % 60}초` : `${rankScoreValue}초`}</strong></p>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>학번과 이름 입력:</label>
            <input 
              type="text" 
              placeholder="예: 30105 홍길동" 
              value={studentNameInput} 
              onChange={(e) => setStudentNameInput(e.target.value)} 
              disabled={isSubmittingRank}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '15px', fontSize: '14px', background: isSubmittingRank ? '#e9ecef' : '#fff' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setRankModalOpen(false)} 
                disabled={isSubmittingRank}
                style={{ padding: '8px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                취소
              </button>
              <button 
                onClick={submitRankingData} 
                disabled={isSubmittingRank}
                style={{ padding: '8px 14px', background: isSubmittingRank ? '#8fc49c' : '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: isSubmittingRank ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isSubmittingRank ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>💬 문제 ID [{feedbackTargetId}] 피드백</h3>
            <textarea rows="4" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="오탈자나 오류를 적어주세요." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '15px', fontSize: '14px' }}/>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setFeedbackModalOpen(false)} style={{ padding: '8px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
              <button onClick={sendFeedback} style={{ padding: '8px 14px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>보내기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;