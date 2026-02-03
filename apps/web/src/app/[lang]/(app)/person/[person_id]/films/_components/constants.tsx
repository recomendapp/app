import { z } from 'zod';

export const SORT_BY = ["release_date", "vote_average"] as const;
export const DISPLAY = ["grid", "row"] as const;
export const SORT_ORDER = ["asc", "desc"] as const;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 40;
export const DEFAULT_DISPLAY = "grid";
export const DEFAULT_SORT_BY = "release_date";
export const DEFAULT_SORT_ORDER = "desc";

export const sortBySchema = z.enum(SORT_BY);
export const getValidatedSortBy = (order?: string | null): z.infer<typeof sortBySchema> => {
  return sortBySchema.safeParse(order).success ? order! as z.infer<typeof sortBySchema> : DEFAULT_SORT_BY;
};
export const orderSchema = z.enum(SORT_ORDER);
export const getValidatedSortOrder = (order?: string | null): z.infer<typeof orderSchema> => {
  return orderSchema.safeParse(order).success ? order! as z.infer<typeof orderSchema> : DEFAULT_SORT_ORDER;
};
export const pageSchema = z.number().int().positive();
export const getValidatePage = (page?: number | null): number => {
	return pageSchema.safeParse(page).success ? page! : DEFAULT_PAGE;
};
export const displaySchema = z.enum(DISPLAY);
export const getValidatedDisplay = (display?: string | null): z.infer<typeof displaySchema> => {
  return displaySchema.safeParse(display).success ? display! as z.infer<typeof displaySchema> : DEFAULT_DISPLAY;
};
export const departmentSchema = z.string().optional();
export const getValidateDepartment = (
  mediaJobs: { department: string }[],
  department?: string | null
): string | undefined => {
  if (!department) return undefined;

  const allowedDepartments = new Set(
    mediaJobs.map(j => j.department)
  );

  return allowedDepartments.has(department) ? department : undefined;
};
export const jobSchema = z.string().optional();
export const getValidateJob = (
  mediaJobs: {
    department: string;
    jobs: string[] | null;
  }[],
  department?: string,
  job?: string | null
): string | undefined => {
  if (!department || !job) return undefined;

  const departmentEntry = mediaJobs.find(
    d => d.department === department
  );

  if (!departmentEntry?.jobs) return undefined;

  return departmentEntry.jobs.includes(job) ? job : undefined;
};