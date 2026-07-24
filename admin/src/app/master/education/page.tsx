import EducationAdminPanel from "@/components/EducationAdminPanel";
import { masterEduCls } from "@/components/master/eduCls";

/** 교육관리 기본 = 교육이수 신청(승인 대기) */
export default function MasterEducationPage() {
  return <EducationAdminPanel mode="pending" cls={masterEduCls} />;
}
