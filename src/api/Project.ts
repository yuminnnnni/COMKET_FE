import axios from "axios"
import { ProjectData } from "../types/project"

const BASE_URL = import.meta.env.VITE_BACKEND_URL

/**
 * 프로젝트 목록 전체 조회
 * @returns 
 */
export const getAllProjects = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const workspaceName = localStorage.getItem("workspaceName");

    if (!token) throw new Error("로그인 토큰이 없습니다.");
    if (!workspaceName) throw new Error("워크스페이스 정보가 없습니다.");

    const response = await axios.get(
      `${BASE_URL}/api/v1/${workspaceName}/project/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("프로젝트 전체 조회 실패:", error);
    throw error;
  }
};

/**
 * 프로젝트 단건 조회
 * @param projectId
 * @returns 
 */
export const getProjectById = async (projectId: string): Promise<ProjectData> => {
  try {
    const token = localStorage.getItem("accessToken");
    const workspaceName = localStorage.getItem("workspaceName");

    if (!token) throw new Error("로그인 토큰이 없습니다.");
    if (!workspaceName) throw new Error("워크스페이스 정보가 없습니다.");

    const response = await axios.get(
      `${BASE_URL}/api/v1/${workspaceName}/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`프로젝트(${projectId}) 조회 실패:`, error);
    throw error;
  }
};


/**
 * 내가 속한 프로젝트 전체 조회
 * @returns 
 */
export const getMyProjects = async (): Promise<ProjectData[]> => {
  try {
    const token = localStorage.getItem("accessToken");
    const workspaceName = localStorage.getItem("workspaceName");

    if (!token) throw new Error("로그인 토큰이 없습니다.");
    if (!workspaceName) throw new Error("워크스페이스 정보가 없습니다.");

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/${workspaceName}/project/my`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("내가 속한 프로젝트 조회 실패:", error);
    throw error;
  }
};


interface CreateProjectDto {
  name: string;
  description: string;
  isPublic: boolean;
  profile_file_id: number | null;
}

/**
 * 프로젝트 생성
 * @param projectData 
 * @returns 
 */
export const createProject = async (projectData: CreateProjectDto) => {
  try {
    const token = localStorage.getItem("accessToken");
    const workspaceName = localStorage.getItem("workspaceName");

    if (!token) throw new Error("로그인 토큰이 없습니다.");
    if (!workspaceName) throw new Error("워크스페이스 정보가 없습니다.");

    const response = await axios.post(
      `${BASE_URL}/api/v1/${workspaceName}/project`,
      projectData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("프로젝트 생성 실패:", error);
    throw error;
  }
};
