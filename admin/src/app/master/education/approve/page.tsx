import EducationAdminPanel from "@/components/EducationAdminPanel";
import { masterEduCls } from "@/components/master/eduCls";

export default function MasterEducationApprovePage() {
  return <EducationAdminPanel mode="approved" cls={masterEduCls} />;
}
