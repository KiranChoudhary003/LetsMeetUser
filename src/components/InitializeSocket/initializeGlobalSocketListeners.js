
export const initializeGlobalSocketListeners = (
    socket,
    { onMeetingRequest, onMeetingError, onMeetingDeclined, onWriteMeetingNotes },
) => {
    socket.on('meeting_request', onMeetingRequest);
    socket.on('write_meeting_notes', onWriteMeetingNotes);
    socket.on('meeting_error', onMeetingError);
    socket.on('meeting_declined', onMeetingDeclined);
};
