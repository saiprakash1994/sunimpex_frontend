import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorToast, successToast } from "../../../../shared/utils/appToaster";
import { PageTitle } from "../../../../shared/components/PageTitle/PageTitle";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import "./DairyAdd.scss";
import {
    useEditDairyMutation,
    useGetDairyByIdQuery,
} from "../../store/dairyEndPoint";

const DairyAdd = () => {
    const navigate = useNavigate();
    const { dairyCode: id } = useParams();

    const {
        data: dairyData,
        isSuccess,
        isLoading: fetching,
        isError,
        refetch
    } = useGetDairyByIdQuery(id, { skip: !id });

    const [editDairy, { isLoading: updating }] = useEditDairyMutation();

    const [form, setForm] = useState({
        dairyName: "",
        email: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    const [touched, setTouched] = useState({
        dairyName: false,
        email: false,
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    useEffect(() => {
        if (id && isSuccess && dairyData) {
            setForm({
                dairyName: dairyData?.dairyName || "",
                email: dairyData?.email || "",
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [id, dairyData, isSuccess]);

    useEffect(() => {
        if (id && isError) {
            errorToast("Failed to fetch dairy data.");
        }
    }, [id, isError]);

    const validateField = (name, value) => {
        switch (name) {
            case "dairyName":
                if (!value.trim()) return "Dairy name is required.";
                return "";
            case "email":
                if (!value.trim()) return "Email is required.";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return "Enter a valid email.";
                return "";
            case "oldPassword":
                if (form.newPassword && !value) return "Old password is required.";
                return "";
            case "newPassword":
                if (form.newPassword && !value) return "New password is required.";
                return "";
            case "confirmPassword":
                if (form.newPassword !== value) return "Passwords do not match.";
                return "";
            default:
                return "";
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    const onSave = async () => {
        // Validate all fields before submit
        const fields = ["dairyName", "email", "oldPassword", "newPassword", "confirmPassword"];
        const errs = {};
        fields.forEach(field => {
            errs[field] = validateField(field, form[field]);
        });
        setErrors(errs);
        setTouched(fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
        if (Object.values(errs).some(Boolean)) return;
        try {
            const payload = {
                id,
                dairyName: form.dairyName,
                email: form.email,
            };
            if (form.newPassword) {
                payload.password = form.newPassword;
                payload.oldPassword = form.oldPassword;
            }
            await editDairy({ id, ...payload }).unwrap();
            successToast("Dairy updated successfully.");
            // Remove unnecessary refetch - RTK Query handles cache invalidation
            // await refetch();
            navigate("/");
        } catch (err) {
            const message = err?.data?.error || "Failed to save dairy.";
            errorToast(message);
            console.error(err);
        }
    };

    const saving = updating;

    return (
        <div className="dairyadd-center fade-in">
            <div className="dairyadd-bg-illustration" aria-hidden="true"></div>
            <div className="w-100 dairy-add-responsive" style={{ maxWidth: 480 }}>
                <Card className="dairyadd-card modern-card shadow-lg">
                    <Card.Body className="p-4">
                        <div className="mb-4 text-center">
                            <h3 className="dairyadd-title mb-1">Update Details</h3>
                            <div className="dairyadd-subtitle">Update Details below.</div>
                        </div>
                        {/* Error summary */}
                        {Object.values(errors).some(Boolean) && (
                            <div className="alert alert-danger" role="alert" style={{ background: '#ffe6e6', color: '#b02a37', borderColor: '#dc3545' }}>
                                Please fix the errors below.
                            </div>
                        )}
                        <Form autoComplete="off">
                            <h5 className="mb-3" style={{ color: '#2c3e50', fontWeight: 700 }}>Dairy Details</h5>
                            <Form.Group className="form-floating mb-3">
                                <Form.Control
                                    type="text"
                                    id="dairyName"
                                    name="dairyName"
                                    value={form.dairyName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Enter Dairy Name"
                                    disabled={saving}
                                    maxLength={40}
                                    isInvalid={!!errors.dairyName && touched.dairyName}
                                    isValid={!errors.dairyName && touched.dairyName}
                                />
                                <Form.Label htmlFor="dairyName">Dairy Name</Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.dairyName}</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="form-floating mb-3">
                                <Form.Control
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Enter Email"
                                    disabled={saving}
                                    isInvalid={!!errors.email && touched.email}
                                    isValid={!errors.email && touched.email}
                                />
                                <Form.Label htmlFor="email">Email</Form.Label>
                                <div className="form-text">We'll never share your email.</div>
                                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                            </Form.Group>
                            <h5 className="mb-3 mt-4" style={{ color: '#2c3e50', fontWeight: 700 }}>Change Password</h5>
                            <div className="dairyadd-password-section position-relative mb-3">
                                <Form.Group className="form-floating mb-3 position-relative">
                                    <Form.Control
                                        type={showPassword.old ? "text" : "password"}
                                        id="oldPassword"
                                        name="oldPassword"
                                        value={form.oldPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter Old Password"
                                        disabled={saving}
                                        isInvalid={!!errors.oldPassword && touched.oldPassword}
                                        isValid={!errors.oldPassword && touched.oldPassword}
                                    />
                                    <Form.Label htmlFor="oldPassword">Old Password</Form.Label>
                                </Form.Group>
                                <Form.Group className="form-floating mb-3 position-relative">
                                    <Form.Control
                                        type={showPassword.new ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        value={form.newPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter New Password"
                                        disabled={saving}
                                        isInvalid={!!errors.newPassword && touched.newPassword}
                                        isValid={!errors.newPassword && touched.newPassword}
                                    />
                                    <Form.Label htmlFor="newPassword">New Password</Form.Label>
                                </Form.Group>
                                <Form.Group className="form-floating mb-0 position-relative">
                                    <Form.Control
                                        type={showPassword.confirm ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Confirm Password"
                                        disabled={saving}
                                        isInvalid={!!errors.confirmPassword && touched.confirmPassword}
                                        isValid={!errors.confirmPassword && touched.confirmPassword}
                                    />
                                    <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
                                </Form.Group>
                            </div>
                            <div className="dairyadd-btn-row">
                                <Button variant="primary" onClick={onSave} disabled={saving} className="px-4">
                                    {saving ? <Spinner size="sm" animation="border" /> : "Update"}
                                </Button>
                                <Button variant="outline-secondary" onClick={() => navigate("/")} disabled={saving} className="px-4">
                                    Cancel
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default DairyAdd;
