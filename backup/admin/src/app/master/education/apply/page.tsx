import EducationAdminPanel from "@/components/EducationAdminPanel";
import { masterEduCls } from "@/components/master/eduCls";

export default function MasterEducationApplyPage() {
  return <EducationAdminPanel mode="pending" cls={masterEduCls} />;
}
