export type OrganizerProposalType = "todoist" | "karakeep";
export type OrganizerProposalStatus = "pending" | "approved" | "rejected";

export interface OrganizerItem {
	id: string;
	text: string;
	url: string | null;
	createdAt: string;
}

export interface TodoistProposal {
	type: "todoist";
	action: "create" | "update";
	content: string;
	description: string;
	projectId: string | null;
	taskId: string | null;
	labels: string[];
	dueString: string | null;
}

export interface KarakeepProposal {
	type: "karakeep";
	url: string;
	title: string;
	tags: string[];
}

export type OrganizerProposalPayload = TodoistProposal | KarakeepProposal;

export interface OrganizerProposal {
	id: string;
	itemId: string;
	payload: OrganizerProposalPayload;
	rationale: string;
	status: OrganizerProposalStatus;
	createdAt: string;
}

export interface CreateOrganizerItemInput {
	id: string;
	text: string;
	url?: string | null;
}

export interface CreateOrganizerProposalInput {
	itemId: string;
}

export interface ApplyOrganizerProposalInput {
	proposalId: string;
	decision: "approve" | "reject";
}
