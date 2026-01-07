"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have this, if not I'll import Input or simple textarea
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganization } from "@/actions/update-organization";

export function OrganizationDetailsForm({ organization }: { organization: any }) {
    const [isPending, startTransition] = useTransition();

    // Safely access data. Supabase join fetching 1:1 on foreign key usually returns an array or object.
    // Given the structure, let's treat it safely.
    // organization.organization_data might be an array [ {} ] or a single object {} depending on query modifiers.
    // We didn't use .single() on the join, so it might be an array.

    const orgDataRaw = organization.organization_data;
    const orgData = Array.isArray(orgDataRaw) ? orgDataRaw[0] : orgDataRaw || {};

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateOrganization(organization.id, formData);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert("Organization information updated successfully!");
            }
        });
    };

    return (
        <form action={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>
                        Update your organization's public information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Core Info */}
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={organization.name}
                            required
                            minLength={2}
                            placeholder="My Awesome Company"
                        />
                    </div>

                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={orgData.description || ''}
                            placeholder="A brief description of what your organization does..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="email">Public Email</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    defaultValue={orgData.email || ''}
                                    placeholder="contact@company.com"
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    defaultValue={orgData.phone || ''}
                                    placeholder="+1 234 567 890"
                                />
                            </div>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    type="url"
                                    id="website"
                                    name="website"
                                    defaultValue={orgData.website || ''}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        {/* Legal Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Legal & Business</h4>

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="tax_id">Tax ID / CIF</Label>
                                <Input
                                    type="text"
                                    id="tax_id"
                                    name="tax_id"
                                    defaultValue={orgData.tax_id || ''}
                                    placeholder="e.g. B12345678"
                                />
                            </div>

                            {/* Address fields intentionally omitted as requested */}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex justify-between items-center bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                        Address management is handled in a separate section.
                    </p>
                    <Button disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
