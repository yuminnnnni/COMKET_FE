import * as S from './TicketDashboardPage.Style';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TicketListView } from '@/components/ticketView/TicketListView';
import { TicketBoardView } from '@/components/ticketView/TicketBoardView';
import { ListChecks, Rows2, Plus, Bell } from 'lucide-react';
import { Button } from '@components/common/button/Button';
import { CreateTicketModal } from '@components/ticketModal/CreateTicketModal';
import { TicketTemplateModal } from '@/components/ticketModal/TicketTemplateModal';
import { TicketDetailPanel } from '@components/ticketDetailPanel/TicketDetailPanel';
import { Ticket } from '@/types/ticket';
import { GlobalNavBar } from '@/components/common/navBar/GlobalNavBar';
import { LocalNavBar } from '@/components/common/navBar/LocalNavBar';
import { getProjectById, getProjectMembers, getAllProjects, getMyProjects } from '@/api/Project';
import { getTicketsByProjectName } from '@/api/Ticket';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { MemberData } from '@/types/member';
import { TicketDropdownStore } from '@/stores/ticketStore';
import { EmptyTicket } from '@/components/ticket/EmptyTicket';
import { deleteTickets, editSingleTicket } from '@/api/Ticket';
import { DeleteModal } from '@/components/common/modal/DeleteModal';
import { TicketSelectionStore } from '@/components/ticket/TicketSelectionStore';
import { mapTicketFromResponse } from '@/utils/ticketMapper';
import { Status } from '@/types/filter';
import { AlarmPopover } from '@/components/alarm/AlarmPopover';
import { getTicketAlarms, TicketAlarm } from '@/api/Alarm';
import { TicketTemplate } from '@/types/ticketTemplate';
import { useMemo } from 'react';
import { toast } from 'react-toastify';

export const TicketDashboardPage = () => {
  const [viewType, setViewType] = useState<'list' | 'board'>('list');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [projectDescription, setProjectDescription] = useState<string>('');
  const workspaceName = useWorkspaceStore(state => state.workspaceName);
  const tickets = TicketDropdownStore(state => state.tickets);
  const setTickets = TicketDropdownStore(state => state.setTickets);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { selectedIds, clearSelection } = TicketSelectionStore();
  const [hoveredTicket, setHoveredTicket] = useState<Ticket | null>(null);
  const navigate = useNavigate();
  const hasShownToast = useRef(false);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [alarms, setAlarms] = useState<TicketAlarm[]>([]);
  const [alarmTicketIds, setAlarmTicketIds] = useState<Set<number>>(new Set());

  const flattenTickets = (tickets: Ticket[]): Ticket[] => {
    const result: Ticket[] = [];
    const dfs = (ticket: Ticket) => {
      result.push(ticket);
      if (ticket.subtickets) {
        ticket.subtickets.forEach(dfs);
      }
    };
    tickets.forEach(dfs);
    return result;
  };

  const flattenedTickets = useMemo(() => flattenTickets(tickets), [tickets]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getProjectMembers(workspaceName, Number(projectId));
        setMembers(response);
      } catch (error) {
        console.error('멤버 조회 실패:', error);
      }
    };
    fetchMembers();
  }, [workspaceName, projectId]);

  useEffect(() => {
    if (!projectId || !workspaceName || hasShownToast.current) return;

    const fetchProjectInfoAndCheckAccess = async () => {
      try {
        const response = await getProjectById(workspaceName, projectId);
        setProjectName(response.name);
        setProjectDescription(response.description);

        const [all, mine] = await Promise.all([getAllProjects(workspaceName), getMyProjects()]);

        const allProject = all.find(p => String(p.id) === String(projectId));
        const isMine = mine.some(p => String(p.id) === String(projectId));

        if (allProject && allProject.isPublic && !isMine) {
          toast.info('이 프로젝트는 전체공개 상태이며, 조회만 가능합니다.', {
            position: 'top-center',
            autoClose: 4000,
          });
          hasShownToast.current = true;
        }
      } catch (error) {
        console.error('프로젝트 정보 또는 권한 확인 실패:', error);
      }
    };

    fetchProjectInfoAndCheckAccess();
  }, [projectId, workspaceName]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!projectName) return;
      try {
        const tickets = await getTicketsByProjectName(projectName);
        const rawTickets: Ticket[] = tickets.map((t: any) => mapTicketFromResponse(t));
        const parentTickets = rawTickets.filter(t => t.parentId === undefined);
        const childTickets = rawTickets.filter(t => t.parentId !== undefined);

        const buildNestedTickets = (
          tickets: Ticket[],
          parentId: number | undefined = undefined,
          depth: number = 0,
        ): Ticket[] => {
          if (depth >= 3) return [];

          return tickets
            .filter(ticket => ticket.parentId === parentId)
            .map(ticket => ({
              ...ticket,
              subtickets: buildNestedTickets(tickets, ticket.id, depth + 1),
            }));
        };

        const nestedTickets = buildNestedTickets(rawTickets);
        setTickets(nestedTickets);
      } catch (e) {
        console.error('티켓 불러오기 실패:', e);
      }
    };

    fetchTickets();
  }, [projectName]);

  useEffect(() => {
    if (!isAlarmOpen && projectId) {
      getTicketAlarms(Number(projectId))
        .then(result => {
          setAlarms(result);
          const alarmIds = result.map(alarm => alarm.ticket_id);
          console.log('알림 티켓 ID:', alarmIds);
          setAlarmTicketIds(new Set(alarmIds));
        })
        .catch(e => {
          console.error('알림 불러오기 실패:', e);
        });
    }
  }, [isAlarmOpen, projectId]);

  const handleTicketClick = (ticket: Ticket) => {
    if (!projectId) return;

    navigate(`/${projectId}/tickets/${ticket.id}/thread`, {
      state: {
        ticket,
        projectName,
      },
    });
  };

  const handleTicketCreate = (newTicket: Ticket) => {
    if (newTicket.parentId) {
      const updated = tickets.map(ticket =>
        ticket.id === newTicket.parentId
          ? {
            ...ticket,
            subtickets: [...(ticket.subtickets ?? []), newTicket],
          }
          : ticket,
      );
      setTickets(updated);
    } else {
      setTickets([newTicket, ...tickets]);
    }

    setIsTemplateModalOpen(false);
  };

  const handleNavigateTicket = (direction: 'prev' | 'next') => {
    if (!selectedTicket && hoveredTicket) {
      setSelectedTicket(hoveredTicket);
      return;
    }

    if (!selectedTicket) return;
    const currentIndex = tickets.findIndex(t => t.id === selectedTicket.id);
    if (currentIndex === -1) return;

    const newIndex =
      direction === 'prev'
        ? (currentIndex - 1 + tickets.length) % tickets.length
        : (currentIndex + 1) % tickets.length;

    console.log('이동:', direction, '->', tickets[newIndex].id);
    setSelectedTicket(tickets[newIndex]);
  };

  const handleBulkDelete = async () => {
    if (!projectName || selectedIds.length === 0) return;
    try {
      await deleteTickets(selectedIds, projectName);
      TicketDropdownStore.getState().deleteManyTicket(selectedIds);
      clearSelection();
      setShowDeleteModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const findTicketById = (tickets: Ticket[], id: number): Ticket | undefined => {
    for (const ticket of tickets) {
      if (ticket.id === id) return ticket;
      if (ticket.subtickets) {
        const found = findTicketById(ticket.subtickets, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const updateTicketStatusRecursive = (
    tickets: Ticket[],
    ticketId: number,
    newStatus: Status,
  ): Ticket[] => {
    return tickets.map(ticket => {
      if (ticket.id === ticketId) {
        return { ...ticket, status: newStatus };
      }
      if (ticket.subtickets && ticket.subtickets.length > 0) {
        return {
          ...ticket,
          subtickets: updateTicketStatusRecursive(ticket.subtickets, ticketId, newStatus),
        };
      }
      return ticket;
    });
  };

  const handleTicketDrop = async (ticketId: number, newStatus: Status) => {
    if (!projectName) return;

    try {
      const ticket = findTicketById(tickets, ticketId);
      if (!ticket) throw new Error('티켓 정보를 찾을 수 없습니다.');

      await editSingleTicket(ticketId, projectName, {
        ticket_name: ticket.title,
        description: ticket.description,
        ticket_type: ticket.type,
        ticket_priority: ticket.priority,
        ticket_state: newStatus,
        start_date: ticket.startDate,
        end_date: ticket.endDate,
        assignee_member_id_list: (ticket.assignee_member_list ?? [])
          .map(m => m.projectMemberId)
          .filter((id): id is number => id !== null && id !== undefined),
        parent_ticket_id: ticket.parentId ?? null,
      });
      // TicketDropdownStore.getState().updateTicketStatus(ticketId, newStatus);
      const updatedTickets = updateTicketStatusRecursive(tickets, ticketId, newStatus);
      setTickets(updatedTickets);
      TicketDropdownStore.getState().setTickets(updatedTickets);
    } catch (e) {
      console.error('드래그 상태 변경 실패:', e);
    }
  };

  const handleInfoClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setHoveredTicket(null);
  };

  return (
    <S.PageContainer>
      <S.GNBContainer>
        <GlobalNavBar variant="workspace" />
      </S.GNBContainer>

      <S.MainContainer>
        <S.LNBContainer>
          <LocalNavBar variant="project" />
        </S.LNBContainer>
        <S.Wrapper>
          <S.Header>
            <S.TitleGroup>
              <div
                style={{
                  width: 'calc(100% - 160px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                }}
              >
                <S.Title>{projectName}</S.Title>
                <S.Description>{projectDescription}</S.Description>
              </div>

              <div style={{ position: 'relative', marginRight: '12px' }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    paddingTop: '16px',
                  }}
                  onClick={async () => {
                    setIsAlarmOpen(prev => !prev);
                    if (!isAlarmOpen && projectId) {
                      try {
                        const result = await getTicketAlarms(Number(projectId));
                        setAlarms(result);
                      } catch (e) {
                        console.error('알림 불러오기 실패:', e);
                      }
                    }
                  }}
                >
                  <Bell size={20} />
                </button>

                {isAlarmOpen && (
                  <AlarmPopover
                    alarms={alarms}
                    onClick={ticketId => {
                      navigate(`/${projectId}/tickets/${ticketId}/thread`);
                      setIsAlarmOpen(false);
                    }}
                  />
                )}
              </div>

              <Button size="md" $variant="tealFilled" onClick={() => setIsTemplateModalOpen(true)}>
                <span style={{ marginRight: '4px' }}>
                  <Plus width="14px" height="14px" />
                </span>
                티켓 생성
              </Button>
            </S.TitleGroup>

            <S.ViewTabBar>
              <S.ViewTab $active={viewType === 'list'} onClick={() => setViewType('list')}>
                <ListChecks size={16} />
                <span>목록</span>
              </S.ViewTab>
              <S.ViewTab $active={viewType === 'board'} onClick={() => setViewType('board')}>
                <Rows2 size={16} />
                <span>보드</span>
              </S.ViewTab>
            </S.ViewTabBar>
          </S.Header>

          {tickets.length === 0 ? (
            <EmptyTicket onCreateTicket={() => setIsTemplateModalOpen(true)} />
          ) : viewType === 'list' ? (
            <TicketListView
              ticketList={tickets}
              onTicketClick={handleTicketClick}
              onDeleteTickets={() => setShowDeleteModal(true)}
              projectName={projectName}
              onInfoClick={handleInfoClick}
              alarmTicketIds={alarmTicketIds}
            />
          ) : (
            <TicketBoardView
              ticketList={tickets}
              onTicketClick={handleTicketClick}
              onTicketDrop={handleTicketDrop}
            />
          )}
        </S.Wrapper>

        {isTemplateModalOpen && (
          <TicketTemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            onSelectTemplate={template => {
              setSelectedTemplate(template);
              setIsTemplateModalOpen(false);
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {isCreateModalOpen && projectName && (
          <CreateTicketModal
            onClose={() => {
              setIsCreateModalOpen(false);
              setSelectedTemplate(null);
            }}
            onSubmit={handleTicketCreate}
            projectName={projectName}
            projectId={Number(projectId)}
            parentTicketId={null}
            template={selectedTemplate!}
          />
        )}

        {(selectedTicket || hoveredTicket) && projectName && (
          <S.PanelWrapper
            onMouseEnter={() => { }}
            onMouseLeave={() => {
              if (!selectedTicket) setHoveredTicket(null);
            }}
          >
            <TicketDetailPanel
              ticket={selectedTicket ?? hoveredTicket}
              projectName={projectName}
              onClose={() => {
                if (selectedTicket) setSelectedTicket(null);
                else setHoveredTicket(null);
              }}
              ticketList={flattenedTickets}
              setTicket={ticket => {
                setSelectedTicket(ticket);
                setHoveredTicket(null);
              }}
            />
          </S.PanelWrapper>
        )}

        {showDeleteModal && (
          <DeleteModal
            title="티켓 삭제"
            message={
              <>
                선택한 티켓 {selectedIds.length}개를 삭제하시겠습니까?
                <br />
                삭제 시 관련 데이터가 모두 제거되며 복구할 수 없습니다.
              </>
            }
            confirmText="삭제"
            cancelText="취소"
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleBulkDelete}
          />
        )}
      </S.MainContainer>
    </S.PageContainer>
  );
};
