import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useUserStore } from '@/stores/userStore';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { PortalDropdown } from '@/utils/PortalDropdown';
import * as S from './WorkspaceSelectorDropdown.Style';
import { fetchMyWorkspaces, exitWorkspace } from '@/api/Workspace';
import { getWorkspaceMembers } from '@/api/Member';
import { WorkspaceExit } from './WorkspaceExit';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  triggerRef: React.RefObject<HTMLElement>;
  close: () => void;
}

export const WorkspaceSelectorDropdown = ({ triggerRef, close }: Props) => {
  const { workspaceId, workspaceSlug, myWorkspaces, setWorkspaceStore, setMyWorkspaces } =
    useWorkspaceStore();
  const email = useUserStore(s => s.email);
  const navigate = useNavigate();

  const [showSub, setShowSub] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const fetchedRef = useRef(false);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick([triggerRef, dropdownRef], close);

  useEffect(() => {
    if (!showSub) return;
    (async () => {
      const list = await fetchMyWorkspaces();
      setMyWorkspaces(list);
    })();
  }, [showSub, setMyWorkspaces]);

  useEffect(() => {
    if (!email || !workspaceId) return;

    (async () => {
      const members = await getWorkspaceMembers(workspaceId);
      const me = members.find(m => m.email === email);
      setIsOwner(me?.positionType === 'OWNER');
    })();
  }, [email, workspaceId]);

  const handleSelect = (ws: (typeof myWorkspaces)[number]) => {
    setWorkspaceStore({
      workspaceId: ws.id,
      workspaceName: ws.name,
      workspaceSlug: ws.slug,
      profileFileUrl: ws.profileFileUrl ?? '',
    });
    navigate(`/${ws.slug}/project`);
    close();
  };

  const handleExit = async () => {
    const storedEmail = localStorage.getItem('email');
    const { workspaceId: id, clearWorkspace } = useWorkspaceStore.getState();
    if (!storedEmail || !id) return;
    await exitWorkspace({ workspaceId: id.toString(), email: storedEmail });
    clearWorkspace();

    ['workspaceId', 'workspaceSlug', 'workspaceName'].forEach(k => localStorage.removeItem(k));
    navigate('/workspace', { replace: true });
    window.location.reload();
  };

  const enter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowSub(true);
  };
  const leave = () => {
    hideTimer.current = setTimeout(() => setShowSub(false), 120);
  };

  return (
    <PortalDropdown triggerRef={triggerRef}>
      <AnimatePresence>
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, type: 'tween' }}
        >
          <S.Dropdown>
            <S.Item onClick={() => navigate(`/${workspaceSlug}/settings`)}>
              워크스페이스 정보
            </S.Item>
            <S.Item onClick={() => navigate('/plan')}>플랜 관리</S.Item>
            <S.Item onClick={() => navigate(`/${workspaceSlug}/member`)}>멤버 관리</S.Item>
            <S.Item onClick={() => navigate(`/${workspaceSlug}/project`)}>프로젝트 관리</S.Item>

            <S.Divider />

            <S.SubWrapper onMouseEnter={enter} onMouseLeave={leave}>
              <S.Item>
                워크스페이스 변경 <ChevronRight size={16} />
              </S.Item>
              {showSub && (
                <S.SubDropdown
                  as={motion.div}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ type: 'tween', duration: 0.18 }}
                  onMouseEnter={enter}
                  onMouseLeave={leave}
                >
                  {myWorkspaces.map((ws, idx) => (
                    <S.SubItem
                      as={motion.div}
                      key={`${ws.id}-${idx}`}
                      onClick={() => handleSelect(ws)}
                      $active={ws.slug === workspaceSlug}
                      transition={{ type: 'tween', duration: 0.1 }}
                    >
                      {ws.profileFileUrl ? <S.Img src={ws.profileFileUrl} /> : <S.Placeholder />}
                      {ws.name}
                    </S.SubItem>
                  ))}
                  <S.Divider />
                  <S.SubItem onClick={() => navigate('/workspace/create')}>
                    신규 워크스페이스 생성
                  </S.SubItem>
                </S.SubDropdown>
              )}
            </S.SubWrapper>

            <S.Item
              onClick={e => {
                e.stopPropagation();
                setShowExitModal(true);
              }}
            >
              워크스페이스 나가기
            </S.Item>
          </S.Dropdown>
        </motion.div>
      </AnimatePresence>

      {showExitModal && (
        <WorkspaceExit
          isOwner={isOwner}
          onClose={() => setShowExitModal(false)}
          onExit={handleExit}
        />
      )}
    </PortalDropdown>
  );
};
